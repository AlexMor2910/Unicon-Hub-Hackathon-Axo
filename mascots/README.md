# Mascotas de Axo

Tres compañeros: **ajolote** (`axolotl`), **jaguar** (`jaguar`) y **quetzal** (`quetzal`). Cada uno tiene cuatro estados animados:

| Estado | Cuándo se usa | Animación |
|---|---|---|
| `idle` | Por defecto | Respira, parpadea y mueve branquias, orejas o cola (en bucle) |
| `thinking` | Mientras el estudiante responde o pide una pista | Inclina la cabeza y aparecen puntos de pensamiento (en bucle) |
| `celebrate` | Respuesta correcta | Da dos saltos y aparecen destellos (una sola vez) |
| `encourage` | Respuesta incorrecta | Asiente y late un corazón, sin regañar (una sola vez) |

Abre `preview.html` con doble clic para ver todos los estados y la demo interactiva.

## Archivos

- `<id>/<estado>.svg`: 12 SVG autocontenidos, de 4 a 6 KB cada uno. La animación es CSS dentro del propio SVG, así que funcionan como `<img>`.
- `manifest.json`: relaciona cada mascota y estado con su archivo. Las rutas son relativas a la raíz del repo, donde está `Axo.html`, para que funcionen al abrir la app con `file://`.
- `preview.html`: vista previa y demo.
- `../tools/build-mascots.mjs`: generador. **No edites los SVG a mano**: cambia el script y ejecuta `node tools/build-mascots.mjs`.

Todos usan `viewBox="0 0 320 224"`, igual que el ajolote original de `Axo.html`, así que se pueden intercambiar sin mover el layout. El ajolote es una copia fiel del original con su configuración por defecto (rosa, branquias clásicas).

## Integración en la app

1. Para mostrar una mascota: `<img src="mascots/jaguar/idle.svg" alt="Jaguar tranquilo">`.
2. Las reacciones de un solo uso (`celebrate` y `encourage`) deben regresar a `idle` después de unos 2 s. Para que la animación vuelva a empezar, cambia el `src` (por ejemplo, agregando `?t=` + `Date.now()`). `preview.html` tiene el ejemplo.
3. Equivalencia con los estados que ya usa el componente del ajolote en `Axo.html`:

   | Actual (`mood`) | Nuevo estado |
   |---|---|
   | `idle` | `idle` |
   | `focused` | `thinking` |
   | `happy` | `celebrate` |
   | `confused`, `hint` | `encourage` |

4. Si falta un estado, usa `fallback`, que es `idle`.

## Accesibilidad

- Con `prefers-reduced-motion: reduce` no se anima nada y se muestran las poses estáticas completas.
- No hay sonido ni destellos rápidos. Los saltos están contenidos dentro del `viewBox`, así que no mueven el layout.
- Cada SVG tiene `role="img"`, `aria-label` y `<title>` en español.

## Pendiente

- Los accesorios y colores de la tienda (sombrero, lentes, moño) solo existen para el ajolote dentro de `Axo.html`; no se aplican a estos SVG.
- Falta el selector de mascota dentro de la app, que depende del código fuente del frontend.

## Procedencia

Todas las ilustraciones son originales, dibujadas con formas SVG para este proyecto. No usan assets de terceros.
