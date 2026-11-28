// Selector de mascota para Axo.html, sin tocar el bundle compilado.
//
// Agrega un botón flotante "Compañero" para elegir ajolote, jaguar o quetzal.
// Con jaguar o quetzal, cada <svg class="mascot"> de la app se oculta y en su
// lugar se muestra el SVG animado equivalente. El estado sale del aria-label
// que pone el componente original ("Axo, un ajolote feliz", etc.).
// Con el ajolote no se reemplaza nada, para conservar los colores y
// accesorios de la tienda.
(() => {
  const KEY = "axo.mascot.v1";
  const BASE = "mascots/";
  const MASCOTS = {
    axolotl: "Ajolote",
    jaguar: "Jaguar",
    quetzal: "Quetzal",
  };
  // Expresión del componente original -> estado nuevo.
  const MOODS = [
    ["con una pista", "encourage"],
    ["confundido", "encourage"],
    ["concentrado", "thinking"],
    ["feliz", "celebrate"],
    ["tranquilo", "idle"],
  ];
  const STATE_ES = { idle: "tranquilo", thinking: "pensando", celebrate: "celebrando", encourage: "dando ánimos" };

  function load() {
    try {
      const v = localStorage.getItem(KEY);
      return v in MASCOTS ? v : "axolotl";
    } catch {
      return "axolotl";
    }
  }
  function save(v) {
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* sin almacenamiento: la elección dura hasta recargar */
    }
  }

  let current = load();

  function stateOf(svg) {
    const label = svg.getAttribute("aria-label") || "";
    const hit = MOODS.find(([word]) => label.includes(word));
    return hit ? hit[1] : "idle";
  }

  // Último estado visto en cada contenedor, para detectar cambios
  // (por ejemplo, de "concentrado" a "con una pista" justo después de fallar).
  const lastState = new WeakMap();

  function sync(svg) {
    // La vista previa de la tienda siempre muestra al ajolote con su ropa.
    if (svg.closest(".customization-stage")) return;
    let img = svg.nextElementSibling;
    if (!img || !img.classList.contains("mascot-alt")) img = null;

    const state = stateOf(svg);
    const host = svg.parentElement;
    const prev = lastState.get(host);
    lastState.set(host, state);
    const reacted = prev !== undefined && prev !== state && (state === "encourage" || state === "celebrate");

    if (current === "axolotl") {
      svg.style.removeProperty("display");
      img?.remove();
      if (reacted) coach.show(svg, state);
      return;
    }
    const src = `${BASE}${current}/${state}.svg`;
    if (!img) {
      img = document.createElement("img");
      img.className = "mascot mascot-alt";
      svg.after(img);
    }
    svg.style.display = "none";
    if (img.dataset.src !== src) {
      img.dataset.src = src;
      img.src = src;
      img.alt = `${MASCOTS[current]} ${STATE_ES[state]}`;
    }
    if (reacted) coach.show(img, state);
  }

  // ---------- Globos de diálogo: preguntas que guían, nunca la respuesta ----------
  const SKILL_QUESTIONS = {
    suma: ["¿Juntaste primero las unidades? Si pasan de 9, ¿qué haces con la decena que sobra?", "Estima antes de calcular: ¿tu resultado debería ser mayor o menor que 50?"],
    resta: ["¿Cuál número es mayor? Si arriba hay menos unidades, ¿de dónde puedes tomar una decena?", "Comprueba al revés: si sumas tu resultado y lo que quitaste, ¿regresas al inicio?"],
    comparacion: ["Compara primero las cifras de la izquierda. ¿Cuál vale más?", "¿Qué diferencia hay entre las dos cantidades? Calcúlala antes de decidir."],
    multiplicacion: ["¿Cuántos grupos hay y cuántos elementos tiene cada grupo?", "¿Puedes dibujar los grupos o sumar el mismo número varias veces?"],
    division: ["Si repartes de uno en uno, ¿cuántas vueltas das hasta acabarte todo?", "¿Qué número multiplicado por los grupos te da el total?"],
    fracciones: ["¿En cuántas partes iguales se dividió el todo? ¿Cuántas partes tomas?", "¿Qué indica el número de abajo y qué indica el de arriba?"],
    decimales: ["Alinea el punto decimal. ¿Qué cifra está en el lugar de los décimos?", "¿Es lo mismo 0.5 que 0.50? ¿Cuál es mayor, 0.5 o 0.45?"],
    cambio: ["¿Cuánto había al principio y cuánto se fue? ¿Qué operación une esos datos?", "¿Te preguntan lo que queda o lo que se usó?"],
    "varios-pasos": ["¿Qué necesitas calcular primero para poder responder la pregunta?", "Escribe tu primer paso. ¿Ese resultado es la respuesta final o solo un dato?"],
  };
  const AREA_QUESTIONS = {
    math: ["¿Puedes estimar el resultado antes de calcular? ¿Tu respuesta se acerca?", "¿Qué operación pide el problema: sumar, restar, multiplicar o dividir?", "Comprueba con la operación inversa: ¿regresas al número inicial?"],
    reading: ["¿En qué párrafo está la pista? Vuelve a leerlo con calma.", "¿Eso lo dice el texto o lo estás suponiendo?", "Busca una frase del texto que apoye tu respuesta.", "¿Qué pasó antes y qué pasó después en la historia?"],
    spelling: ["Lee la palabra en voz baja: ¿cómo suena y cómo se escribe?", "¿Conoces otra palabra de la misma familia? Por ejemplo, hoja y hojita.", "¿Dónde está la sílaba que suena más fuerte? ¿Esa regla pide tilde?"],
    any: ["¿Qué te pide exactamente la pregunta? Léela otra vez.", "¿Qué dato no usaste todavía?"],
  };
  const CHEERS = {
    math: ["¡Muy bien! ¿Cómo lo resolviste? Explícalo con tus palabras.", "¡Lo lograste! ¿Podrías resolverlo de otra forma?"],
    reading: ["¡Excelente! ¿Qué parte del texto te ayudó a decidir?", "¡Bien leído! ¿Cómo explicarías tu respuesta a un compañero?"],
    spelling: ["¡Correcto! ¿Qué regla te ayudó a escribirla bien?", "¡Bien! ¿Se te ocurre otra palabra que siga la misma regla?"],
    any: ["¡Muy bien! ¿Qué paso te ayudó más?"],
  };

  function routePath() {
    return location.protocol === "file:" ? location.hash.replace(/^#/, "") : location.pathname;
  }
  function context() {
    const path = routePath();
    const node = (path.match(/^\/ruta\/([^/?#]+)/) || [])[1];
    if (node) return { area: node.startsWith("lectura") ? "reading" : "math", skill: node };
    if (path.startsWith("/matematicas")) return { area: "math" };
    if (path.startsWith("/lectura")) return { area: "reading" };
    if (path.startsWith("/ortografia")) return { area: "spelling" };
    return { area: "any" };
  }
  let turn = 0;
  const pick = (list) => list[turn++ % list.length];

  const coach = (() => {
    const el = document.createElement("div");
    el.className = "coach-bubble";
    el.setAttribute("role", "status");
    el.hidden = true;
    let anchor = null;
    let hideTimer;

    function place() {
      if (!anchor || el.hidden) return;
      const r = anchor.getBoundingClientRect();
      if (!r.width) return hide();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), innerWidth - w - 12);
      const above = r.top - h - 14 > 8;
      const top = above ? r.top - h - 14 : r.bottom + 14;
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      el.dataset.side = above ? "above" : "below";
      el.style.setProperty("--tail-x", `${Math.min(Math.max(20, r.left + r.width / 2 - left), w - 20)}px`);
    }
    function hide() {
      el.hidden = true;
      anchor = null;
      clearTimeout(hideTimer);
    }
    function show(target, state) {
      const { area, skill } = context();
      const name = current === "axolotl" ? "Axo" : MASCOTS[current];
      let title, text;
      if (state === "celebrate") {
        title = `${name} dice:`;
        text = pick(CHEERS[area]);
      } else {
        title = `${name} pregunta:`;
        text = pick(skill && SKILL_QUESTIONS[skill] ? SKILL_QUESTIONS[skill] : AREA_QUESTIONS[area]);
      }
      el.innerHTML = "";
      const t = document.createElement("strong");
      t.textContent = title;
      const p = document.createElement("p");
      p.textContent = text;
      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "Entendido";
      close.addEventListener("click", hide);
      el.append(t, p, close);
      el.dataset.mood = state;
      anchor = target;
      el.hidden = false;
      place();
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hide, state === "celebrate" ? 6000 : 12000);
    }
    addEventListener("scroll", place, { passive: true });
    addEventListener("resize", place);
    addEventListener("hashchange", hide);
    addEventListener("popstate", hide);
    return { el, show, hide };
  })();

  function syncAll() {
    document.querySelectorAll("svg.mascot").forEach(sync);
  }

  // React vuelve a pintar a menudo; observamos cambios y el aria-label.
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      syncAll();
    });
  });

  // ---------- Botón flotante ----------
  const style = document.createElement("style");
  style.textContent = `
    .mascot-picker{position:fixed;right:16px;bottom:16px;z-index:50;font-family:Inter,system-ui,sans-serif}
    .mascot-picker>button,.mascot-picker [role=menu] button{font:inherit;font-weight:700;color:#f8fafc;border:0;border-radius:12px;cursor:pointer}
    .mascot-picker>button{display:flex;align-items:center;gap:8px;padding:8px 14px 8px 8px;background:#18223d;border:1px solid #394667;box-shadow:0 8px 24px rgba(0,0,0,.35)}
    .mascot-picker>button img{width:44px;height:auto}
    .mascot-picker [role=menu]{position:absolute;right:0;bottom:calc(100% + 8px);display:grid;gap:6px;padding:8px;background:#0f1629;border:1px solid #394667;border-radius:16px;min-width:190px}
    .mascot-picker [role=menu][hidden]{display:none}
    .mascot-picker [role=menu] button{display:flex;align-items:center;gap:10px;padding:6px 10px 6px 6px;background:#28335c;text-align:left}
    .mascot-picker [role=menu] button[aria-checked=true]{background:linear-gradient(90deg,#c4b5fd,#67e8f9);color:#0b1020}
    .mascot-picker [role=menu] img{width:40px;height:auto}
    .mascot-picker button:focus-visible{outline:3px solid #22d3ee;outline-offset:2px}
    img.mascot-alt{height:auto;display:block}
    .coach-bubble{position:fixed;z-index:60;width:min(300px,calc(100vw - 24px));padding:12px 14px;background:#f8fafc;color:#1b1630;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.4);font-family:Inter,system-ui,sans-serif;font-size:.95rem;line-height:1.45;animation:coach-in .25s ease-out}
    .coach-bubble[hidden]{display:none}
    .coach-bubble strong{display:block;color:#6d28d9;font-size:.85rem}
    .coach-bubble[data-mood=celebrate] strong{color:#0f766e}
    .coach-bubble p{margin:4px 0 8px;color:#1b1630}
    .coach-bubble button{font:inherit;font-weight:700;font-size:.85rem;color:#1b1630;background:#e9e3ff;border:0;border-radius:10px;padding:6px 10px;cursor:pointer}
    .coach-bubble button:focus-visible{outline:3px solid #22d3ee;outline-offset:2px}
    .coach-bubble::after{content:"";position:absolute;left:calc(var(--tail-x,50%) - 9px);border:9px solid transparent}
    .coach-bubble[data-side=above]::after{top:100%;border-top-color:#f8fafc}
    .coach-bubble[data-side=below]::after{bottom:100%;border-bottom-color:#f8fafc}
    @keyframes coach-in{from{opacity:0;transform:translateY(6px) scale(.97)}to{opacity:1;transform:none}}
    @media (prefers-reduced-motion:reduce){.coach-bubble{animation:none}}
  `;

  function buildPicker() {
    const wrap = document.createElement("div");
    wrap.className = "mascot-picker";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.setAttribute("aria-haspopup", "menu");
    toggle.setAttribute("aria-expanded", "false");
    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Elige tu compañero");
    menu.hidden = true;

    function render() {
      toggle.innerHTML = `<img src="${BASE}${current}/idle.svg" alt=""><span>Compañero: ${MASCOTS[current]}</span>`;
      menu.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.id === current)));
    }
    function close() {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    }

    for (const [id, name] of Object.entries(MASCOTS)) {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "menuitemradio");
      b.dataset.id = id;
      b.innerHTML = `<img src="${BASE}${id}/idle.svg" alt=""><span>${name}</span>`;
      b.addEventListener("click", () => {
        current = id;
        save(id);
        render();
        close();
        syncAll();
        toggle.focus();
      });
      menu.append(b);
    }
    toggle.addEventListener("click", () => {
      const open = menu.hidden;
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      if (open) menu.querySelector("[aria-checked=true]")?.focus();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) {
        close();
        toggle.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) close();
    });

    wrap.append(menu, toggle);
    render();
    return wrap;
  }

  function start() {
    document.head.append(style);
    document.body.append(buildPicker(), coach.el);
    syncAll();
    observer.observe(document.getElementById("app") || document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-label"],
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
