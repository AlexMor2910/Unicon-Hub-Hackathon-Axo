#!/usr/bin/env python3
"""
Validador y utilidades de integración para la base de datos de ejercicios de Axo.
Cumple con contracts/exercise.schema.json y EXERCISES_DATABASE.md (UniconHub Hack 2026).
"""

import json
import math
import sys
import unicodedata
from collections import Counter
from pathlib import Path

SKILL_MAP = {
    "math": {
        "suma",
        "resta",
        "comparacion",
        "multiplicacion",
        "division",
        "fracciones",
        "decimales",
        "cambio",
        "varios-pasos",
    },
    "reading": {
        "datos",
        "secuencia",
        "inferencia",
        "idea",
        "opinion",
        "vocab",
    },
    "spelling": {
        "accent",
        "bv",
        "csz",
        "gj",
        "h",
        "homophones",
        "other",
    },
}

LEGACY_PREFIXES = (
    "una-marca-roja-",
    "lo-que-detiene-la-cuerda-",
    "una-prueba-con-olas-",
    "tierra-seca-",
    "el-resultado-extrano-",
    "lo-que-dicen-seis-macetas-",
    "la-puerta-de-los-letreros-",
    "cien-kilos-sobre-el-puente-",
    "una-salida-para-dos-",
    "lectura-",
)


def normalize_text(text: str, case_sensitive: bool = False, strip_accents: bool = False) -> str:
    s = " ".join(text.strip().split())
    if not case_sensitive:
        s = s.lower()
    if strip_accents:
        s = "".join(
            ch for ch in unicodedata.normalize("NFD", s)
            if unicodedata.category(ch) != "Mn"
        )
    return s


def to_public_payload(exercise: dict) -> dict:
    """Devuelve el payload público sin answer_key ni explanation previa."""
    public = {k: v for k, v in exercise.items() if k not in ("answer_key", "explanation")}
    public["hint_count"] = len(exercise.get("hints", []))
    return public


def get_hint(exercise: dict, hint_index: int) -> dict:
    """Implementa POST /api/v1/exercises/{id}/hint."""
    hints = exercise.get("hints", [])
    if hint_index < 0 or hint_index >= len(hints):
        raise IndexError(f"hint_index fuera de rango: {hint_index}")
    return {
        "hint": hints[hint_index],
        "has_more": hint_index + 1 < len(hints),
    }


def grade_attempt(exercise: dict, answer) -> dict:
    """Evalúa un intento del estudiante contra answer_key."""
    ex_type = exercise["type"]
    key = exercise["answer_key"]
    correct = False

    if ex_type == "multiple_choice":
        correct = isinstance(answer, str) and answer.strip() == key["choice_id"]
    elif ex_type == "numeric":
        try:
            val = float(answer)
            if math.isfinite(val):
                correct = abs(val - float(key["value"])) <= float(key["tolerance"])
        except (TypeError, ValueError):
            correct = False
    elif ex_type == "short_text":
        if isinstance(answer, str):
            norm_user = normalize_text(
                answer,
                case_sensitive=key["case_sensitive"],
                strip_accents=key["strip_accents"],
            )
            accepted_norm = {
                normalize_text(
                    acc,
                    case_sensitive=key["case_sensitive"],
                    strip_accents=key["strip_accents"],
                )
                for acc in key["accepted"]
            }
            correct = norm_user in accepted_norm

    return {
        "correct": correct,
        "feedback": "¡Excelente razonamiento!" if correct else "Revisa el procedimiento y vuelve a intentarlo.",
        "explanation": exercise["explanation"],
    }


def validate_exercises(data_path: Path, schema_path: Path) -> int:
    errors = []

    if not schema_path.exists():
        print(f"[ERROR] No existe el esquema: {schema_path}", file=sys.stderr)
        return 1
    if not data_path.exists():
        print(f"[ERROR] No existe el archivo de datos: {data_path}", file=sys.stderr)
        return 1

    with schema_path.open("r", encoding="utf-8") as f:
        schema = json.load(f)
    with data_path.open("r", encoding="utf-8") as f:
        exercises = json.load(f)

    if not isinstance(exercises, list) or len(exercises) == 0:
        print("[ERROR] exercises.json debe ser un arreglo JSON no vacío.", file=sys.stderr)
        return 1

    # Validación opcional con jsonschema si está instalado en el entorno
    try:
        import jsonschema
        validator = jsonschema.Draft202012Validator(schema)
        for idx, item in enumerate(exercises):
            for err in validator.iter_errors(item):
                errors.append(f"Item[{idx}] ({item.get('id', '?')}): esquema inválido -> {err.message}")
    except ImportError:
        pass

    seen_ids = set()
    allowed_fields = set(schema["properties"].keys())
    required_fields = set(schema["required"])

    for idx, item in enumerate(exercises):
        prefix = f"Item[{idx}] ({item.get('id', 'SIN_ID')})"

        if not isinstance(item, dict):
            errors.append(f"{prefix}: debe ser un objeto JSON.")
            continue

        missing = required_fields - set(item.keys())
        if missing:
            errors.append(f"{prefix}: faltan campos obligatorios: {sorted(missing)}")

        extra = set(item.keys()) - allowed_fields
        if extra:
            errors.append(f"{prefix}: campos no permitidos por el contrato: {sorted(extra)}")

        ex_id = item.get("id", "")
        if not isinstance(ex_id, str) or not ex_id.strip():
            errors.append(f"{prefix}: id vacío o inválido.")
        elif ex_id in seen_ids:
            errors.append(f"{prefix}: ID duplicado '{ex_id}'.")
        else:
            seen_ids.add(ex_id)

        if any(ex_id.startswith(lp) for lp in LEGACY_PREFIXES):
            errors.append(f"{prefix}: colisión potencial con prefijo heredado de Axo.html.")

        subject = item.get("subject")
        skill_id = item.get("skill_id")
        if subject not in SKILL_MAP:
            errors.append(f"{prefix}: subject inválido '{subject}'.")
        elif skill_id not in SKILL_MAP[subject]:
            errors.append(f"{prefix}: skill_id '{skill_id}' no pertenece a subject '{subject}'.")

        difficulty = item.get("difficulty")
        if difficulty not in ("easy", "medium", "hard"):
            errors.append(f"{prefix}: difficulty inválido '{difficulty}'.")

        prompt = item.get("prompt", "")
        if not isinstance(prompt, str) or len(prompt.strip()) < 5:
            errors.append(f"{prefix}: prompt vacío o demasiado corto.")

        hints = item.get("hints", [])
        if not isinstance(hints, list) or len(hints) < 2 or any(not isinstance(h, str) or len(h.strip()) < 5 for h in hints):
            errors.append(f"{prefix}: debe tener al menos 2 pistas no vacías.")

        explanation = item.get("explanation", "")
        if not isinstance(explanation, str) or len(explanation.strip()) < 10:
            errors.append(f"{prefix}: explanation vacía o demasiado corta.")

        source = item.get("source", "")
        if not isinstance(source, str) or len(source.strip()) < 5:
            errors.append(f"{prefix}: source vacía.")

        # Validación específica de lectura
        if subject == "reading":
            passage = item.get("passage")
            if not isinstance(passage, dict) or not passage.get("paragraphs"):
                errors.append(f"{prefix}: reactivo de lectura sin passage válido.")
            else:
                valid_p_ids = {p.get("id") for p in passage["paragraphs"] if isinstance(p, dict)}
                ev = item.get("evidence_paragraphs", [])
                if not isinstance(ev, list) or len(ev) == 0:
                    errors.append(f"{prefix}: reactivo de lectura sin evidence_paragraphs.")
                elif not set(ev).issubset(valid_p_ids):
                    errors.append(f"{prefix}: evidence_paragraphs {ev} contiene IDs inexistentes en passage {sorted(valid_p_ids)}.")

        # Validación por tipo de pregunta
        ex_type = item.get("type")
        key = item.get("answer_key", {})
        if ex_type == "multiple_choice":
            options = item.get("options")
            if not isinstance(options, list) or len(options) < 3:
                errors.append(f"{prefix}: multiple_choice requiere al menos 3 opciones.")
            else:
                opt_ids = [o.get("id") for o in options if isinstance(o, dict)]
                opt_texts = [o.get("text", "").strip() for o in options if isinstance(o, dict)]
                if len(set(opt_ids)) != len(options):
                    errors.append(f"{prefix}: IDs de opciones duplicados.")
                if len(set(opt_texts)) != len(options):
                    errors.append(f"{prefix}: textos de opciones duplicados.")
                if key.get("choice_id") not in opt_ids:
                    errors.append(f"{prefix}: choice_id '{key.get('choice_id')}' no coincide con ninguna opción.")
        elif ex_type == "numeric":
            val = key.get("value")
            tol = key.get("tolerance")
            if not isinstance(val, (int, float)) or isinstance(val, bool) or not math.isfinite(val):
                errors.append(f"{prefix}: answer_key.value numérico inválido.")
            if not isinstance(tol, (int, float)) or isinstance(tol, bool) or tol < 0:
                errors.append(f"{prefix}: answer_key.tolerance inválido.")
        elif ex_type == "short_text":
            acc = key.get("accepted")
            if not isinstance(acc, list) or len(acc) == 0 or any(not isinstance(a, str) or not a.strip() for a in acc):
                errors.append(f"{prefix}: answer_key.accepted debe ser lista no vacía de textos.")
            if subject == "spelling" and key.get("strip_accents") is True:
                errors.append(f"{prefix}: en ortografía no se deben eliminar tildes indiscriminadamente (strip_accents debe ser false).")
        else:
            errors.append(f"{prefix}: type inválido '{ex_type}'.")

    if errors:
        print(f"[FALLÓ VALIDACIÓN] Se encontraron {len(errors)} errores:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    # Resumen estadístico
    by_subject = Counter(x["subject"] for x in exercises)
    by_sub_diff = Counter((x["subject"], x["difficulty"]) for x in exercises)
    by_skill = Counter((x["subject"], x["skill_id"]) for x in exercises)

    print(f"[OK] Validación exitosa: {len(exercises)} reactivos verificados sin errores.")
    print("Conteo por materia:", dict(by_subject))
    print("Conteo por materia y dificultad:")
    for (subj, diff), count in sorted(by_sub_diff.items()):
        print(f"  - {subj} / {diff}: {count}")
    print("Conteo por habilidad (skill_id):")
    for (subj, sk), count in sorted(by_skill.items()):
        print(f"  - {subj} -> {sk}: {count}")

    # Demostración de 1 reactivo por materia (payload público, pistas, calificación correcta/incorrecta)
    print("\n--- Demostración funcional (1 reactivo por materia) ---")
    for subj in ("math", "reading", "spelling"):
        sample = next(x for x in exercises if x["subject"] == subj)
        pub = to_public_payload(sample)
        assert "answer_key" not in pub and "explanation" not in pub
        h0 = get_hint(sample, 0)
        h1 = get_hint(sample, 1)
        if sample["type"] == "multiple_choice":
            right_ans = sample["answer_key"]["choice_id"]
            wrong_ans = next(o["id"] for o in sample["options"] if o["id"] != right_ans)
        elif sample["type"] == "numeric":
            right_ans = sample["answer_key"]["value"]
            wrong_ans = right_ans + 999
        else:
            right_ans = sample["answer_key"]["accepted"][0]
            wrong_ans = "respuesta_incorrecta"

        assert grade_attempt(sample, right_ans)["correct"] is True
        assert grade_attempt(sample, wrong_ans)["correct"] is False
        print(f"  * {sample['id']} ({subj}/{sample['skill_id']}): pista1_ok={bool(h0['hint'])}, hay_pista2={h0['has_more']}, pista2_ok={bool(h1['hint'])}, calificacion=OK")

    return 0


if __name__ == "__main__":
    base = Path(__file__).resolve().parent.parent
    data_file = Path(sys.argv[1]) if len(sys.argv) > 1 else base / "data" / "exercises" / "exercises.json"
    schema_file = Path(sys.argv[2]) if len(sys.argv) > 2 else base / "contracts" / "exercise.schema.json"
    sys.exit(validate_exercises(data_file, schema_file))
