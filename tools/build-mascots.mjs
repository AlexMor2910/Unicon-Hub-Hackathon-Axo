// Genera los SVG animados de las mascotas y su manifest.
// Uso: node tools/build-mascots.mjs
// Salida: mascots/<id>/<estado>.svg y mascots/manifest.json
//
// Estilo tomado del ajolote original de Axo.html: viewBox 0 0 320 224,
// formas planas, sombra #b7ddd3 y ojos #342749 en (132,111) y (188,111).

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "mascots");

const STATES = ["idle", "thinking", "celebrate", "encourage"];
const STATE_LABELS = {
  idle: "tranquilo",
  thinking: "pensando",
  celebrate: "celebrando",
  encourage: "dando ánimos",
};
const INK = "#342749";

// ---------- Animaciones compartidas ----------
// transform-box: fill-box hace que transform-origin sea relativo a cada figura.
const CSS = `
.anim,.anim *{transform-box:fill-box}
.char{transform-origin:50% 100%}
.shadow{transform-origin:50% 50%}
.eye{transform-origin:50% 50%}
.st-idle .char{animation:breathe 3.2s ease-in-out infinite}
.st-idle .eye,.st-encourage .eye{animation:blink 4.6s infinite}
.sway-l{transform-origin:100% 60%;animation:sway-l 3.2s ease-in-out infinite}
.sway-r{transform-origin:0% 60%;animation:sway-r 3.2s ease-in-out infinite}
.sway-tail{transform-origin:0% 80%;animation:sway-r 2.6s ease-in-out infinite}
.st-thinking .head{transform-origin:50% 90%;animation:ponder 2.8s ease-in-out infinite}
.st-thinking .dot{animation:dot 1.8s ease-in-out infinite;opacity:.15}
.st-thinking .dot:nth-of-type(2){animation-delay:.3s}
.st-thinking .dot:nth-of-type(3){animation-delay:.6s}
.st-celebrate .char{animation:hop .6s cubic-bezier(.3,.7,.4,1) 2}
.st-celebrate .shadow{animation:squash .6s cubic-bezier(.3,.7,.4,1) 2}
.st-celebrate .spark{transform-origin:50% 50%;animation:twinkle .9s ease-in-out 3 both}
.st-celebrate .spark:nth-of-type(2){animation-delay:.2s}
.st-celebrate .spark:nth-of-type(3){animation-delay:.4s}
.st-celebrate .wing-l{transform-origin:100% 20%;animation:flap-l .3s ease-in-out 4}
.st-celebrate .wing-r{transform-origin:0% 20%;animation:flap-r .3s ease-in-out 4}
.st-encourage .head{transform-origin:50% 90%;animation:nod .8s ease-in-out 2}
.st-encourage .heart{transform-origin:50% 50%;animation:pulse 1.2s ease-in-out 3}
@keyframes breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,.985)}}
@keyframes blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes sway-l{0%,100%{transform:rotate(0)}50%{transform:rotate(-4deg)}}
@keyframes sway-r{0%,100%{transform:rotate(0)}50%{transform:rotate(4deg)}}
@keyframes ponder{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(-5deg) translateY(-1px)}}
@keyframes dot{0%,15%{opacity:.15}45%,100%{opacity:1}}
@keyframes hop{0%,100%{transform:translateY(0) scale(1,1)}15%{transform:translateY(0) scale(1.04,.95)}45%{transform:translateY(-20px) scale(.98,1.03)}75%{transform:translateY(0) scale(1.03,.97)}}
@keyframes squash{0%,100%{transform:scale(1)}45%{transform:scale(.8);opacity:.7}}
@keyframes twinkle{0%{transform:scale(.3);opacity:0}50%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes flap-l{0%,100%{transform:rotate(0)}50%{transform:rotate(18deg)}}
@keyframes flap-r{0%,100%{transform:rotate(0)}50%{transform:rotate(-18deg)}}
@keyframes nod{0%,100%{transform:rotate(0)}30%{transform:rotate(4deg) translateY(2px)}60%{transform:rotate(-2deg)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
@media (prefers-reduced-motion:reduce){.anim *{animation:none!important}.dot,.spark{opacity:1!important}}
`.trim();

// ---------- Piezas reutilizables ----------
const shadow = `<ellipse class="shadow" cx="162" cy="199" rx="104" ry="11" fill="#b7ddd3"/>`;

function eyes(state, [lx, ly], [rx, ry]) {
  if (state === "celebrate") {
    // Ojos felices en arco.
    const arc = (x, y) => `M${x - 7} ${y + 2} Q${x} ${y - 8} ${x + 7} ${y + 2}`;
    return `<path d="${arc(lx, ly)} ${arc(rx, ry)}" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
  }
  const dx = state === "thinking" ? 2 : 0;
  const dy = state === "thinking" ? -3 : 0;
  let out =
    `<circle class="eye" cx="${lx + dx}" cy="${ly + dy}" r="5.5" fill="${INK}"/>` +
    `<circle class="eye" cx="${rx + dx}" cy="${ry + dy}" r="5.5" fill="${INK}"/>`;
  if (state === "encourage") {
    // Cejas en arco, levantadas: mirada cálida y atenta.
    out += `<path d="M${lx - 8} ${ly - 11} Q${lx} ${ly - 17} ${lx + 8} ${ly - 11} M${rx - 8} ${ry - 11} Q${rx} ${ry - 17} ${rx + 8} ${ry - 11}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  }
  return out;
}

function marks(state) {
  if (state === "thinking") {
    return `<g fill="#a78bfa"><circle class="dot" cx="238" cy="60" r="4"/><circle class="dot" cx="254" cy="45" r="6"/><circle class="dot" cx="274" cy="30" r="8"/></g>`;
  }
  if (state === "celebrate") {
    const star = (x, y, s) => `M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`;
    return `<g fill="#fbbf24"><path class="spark" d="${star(250, 46, 14)}"/><path class="spark" d="${star(64, 52, 10)}"/><path class="spark" d="${star(280, 96, 8)}"/></g>`;
  }
  if (state === "encourage") {
    return `<path class="heart" d="M252 60 C236 49 236 34 246 34 C250 34 252 38 252 41 C252 38 254 34 258 34 C268 34 268 49 252 60 Z" fill="#f06f9f"/>`;
  }
  return "";
}

// ---------- Ajolote (copia fiel del original) ----------
const AXO = { head: "#ffc5d8", body: "#ed96b6", tail: "#f3a3bd", paws: "#f8bdd1", cheeks: "#ea85ad", gills: "#dc6394" };
const AXO_MOUTH = {
  idle: `<path d="M151 123 Q160 133 169 123" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  thinking: `<path d="M154 128 H166" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  celebrate: `<path d="M149 121 H171 Q160 143 149 121 Z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
  encourage: `<path d="M152 124 Q160 132 168 124" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
};

function axolotl(state) {
  return `
<g class="char">
  <g class="sway-tail"><path d="M180 175 Q214 185 246 155 Q244 194 187 194 Z" fill="${AXO.tail}"/></g>
  <ellipse cx="159" cy="171" rx="57" ry="30" fill="${AXO.body}"/>
  <path d="M113 174 Q94 184 108 192 H128 M205 174 Q224 184 210 192 H190" fill="${AXO.paws}"/>
  <g class="head">
    <g fill="none" stroke="${AXO.gills}" stroke-width="12" stroke-linecap="round">
      <g class="sway-l"><path d="M100 106 Q73 87 63 58 M94 118 Q62 112 48 89 M96 130 Q69 135 52 122"/></g>
      <g class="sway-r"><path d="M220 106 Q247 87 257 58 M226 118 Q258 112 272 89 M224 130 Q251 135 268 122"/></g>
    </g>
    <rect x="85" y="76" width="150" height="86" rx="43" fill="${AXO.head}"/>
    <ellipse cx="113" cy="127" rx="10" ry="6" fill="${AXO.cheeks}"/>
    <ellipse cx="207" cy="127" rx="10" ry="6" fill="${AXO.cheeks}"/>
    ${eyes(state, [132, 111], [188, 111])}
    ${AXO_MOUTH[state]}
  </g>
</g>`;
}

// ---------- Jaguar ----------
const JAG = { fur: "#f2b544", furDark: "#e29a2e", light: "#fde8c4", spot: "#3a2a1f", spotIn: "#c97a22", ear: "#f3a58f", nose: "#6b3a2e", cheeks: "#f08a6a" };
const rosette = (x, y, r = 6) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${JAG.spotIn}" stroke="${JAG.spot}" stroke-width="3" stroke-dasharray="${(r * 1.1).toFixed(1)} 3.5"/>`;
const JAG_MOUTH = {
  idle: `<path d="M160 127 V132 M150 132 Q155 139 160 132 Q165 139 170 132" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  thinking: `<path d="M160 127 V133 M152 135 H168" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  celebrate: `<path d="M160 127 V130"  stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M147 131 H173 Q160 152 147 131 Z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M153 140 Q160 146 167 140 Q160 150 153 140 Z" fill="#f06f9f"/>`,
  encourage: `<path d="M160 127 V132 M151 133 Q160 141 169 133" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
};

function jaguar(state) {
  return `
<g class="char">
  <g class="sway-tail">
    <path d="M206 182 Q250 188 258 150 Q262 128 247 118" fill="none" stroke="${JAG.fur}" stroke-width="14" stroke-linecap="round"/>
    <path d="M233 178 L240 172 M251 160 L259 157 M257 138 L264 139" stroke="${JAG.spot}" stroke-width="4" stroke-linecap="round"/>
    <path d="M256 133 Q258 124 247 118" fill="none" stroke="${JAG.spot}" stroke-width="14" stroke-linecap="round"/>
  </g>
  <ellipse cx="159" cy="171" rx="58" ry="30" fill="${JAG.fur}"/>
  <ellipse cx="159" cy="180" rx="33" ry="18" fill="${JAG.light}"/>
  ${rosette(118, 164)}${rosette(198, 163)}${rosette(206, 183, 5)}${rosette(112, 184, 5)}
  <path d="M113 176 Q96 186 110 193 H130 M205 176 Q222 186 208 193 H188" fill="${JAG.light}"/>
  <g class="head">
    <g class="sway-l"><circle cx="106" cy="80" r="21" fill="${JAG.furDark}"/><circle cx="106" cy="80" r="10" fill="${JAG.ear}"/></g>
    <g class="sway-r"><circle cx="214" cy="80" r="21" fill="${JAG.furDark}"/><circle cx="214" cy="80" r="10" fill="${JAG.ear}"/></g>
    <ellipse cx="160" cy="117" rx="76" ry="50" fill="${JAG.fur}"/>
    ${rosette(160, 80, 5)}${rosette(134, 86, 4.5)}${rosette(186, 86, 4.5)}${rosette(96, 112, 5)}${rosette(224, 112, 5)}
    <ellipse cx="160" cy="133" rx="28" ry="18" fill="${JAG.light}"/>
    <ellipse cx="114" cy="126" rx="9" ry="5.5" fill="${JAG.cheeks}"/>
    <ellipse cx="206" cy="126" rx="9" ry="5.5" fill="${JAG.cheeks}"/>
    <path d="M131 134 L112 131 M131 140 L114 144 M189 134 L208 131 M189 140 L206 144" stroke="#9b6a35" stroke-width="2" stroke-linecap="round"/>
    ${eyes(state, [132, 109], [188, 109])}
    <path d="M152 120 Q160 116 168 120 Q160 130 152 120 Z" fill="${JAG.nose}"/>
    ${JAG_MOUTH[state]}
  </g>
</g>`;
}

// ---------- Quetzal ----------
const QTZ = { head: "#3cc48a", body: "#2fb37c", wing: "#1f9d6b", tail: "#178a5c", tail2: "#22a873", belly: "#e4474f", beak: "#f6c445", beakLine: "#d99a1e", feet: "#f2a33a", cheeks: "#f28aa0" };
const QTZ_BEAK = {
  closed: `<path d="M151 118 Q160 114 169 118 L160 133 Z" fill="${QTZ.beak}" stroke="${QTZ.beakLine}" stroke-width="2" stroke-linejoin="round"/>`,
  open: `<path d="M150 116 Q160 111 170 116 L160 126 Z" fill="${QTZ.beak}" stroke="${QTZ.beakLine}" stroke-width="2" stroke-linejoin="round"/><path d="M153 129 L167 129 L160 139 Z" fill="${QTZ.beak}" stroke="${QTZ.beakLine}" stroke-width="2" stroke-linejoin="round"/><path d="M155 127 H165" stroke="#c43a52" stroke-width="3" stroke-linecap="round"/>`,
};

function quetzal(state) {
  return `
<g class="char">
  <g class="sway-tail">
    <path d="M196 176 Q244 188 298 204" fill="none" stroke="${QTZ.tail2}" stroke-width="10" stroke-linecap="round"/>
    <path d="M192 184 Q234 202 284 213" fill="none" stroke="${QTZ.tail}" stroke-width="8" stroke-linecap="round"/>
  </g>
  <path d="M148 190 V199 M170 190 V199" stroke="${QTZ.feet}" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="159" cy="166" rx="50" ry="34" fill="${QTZ.body}"/>
  <ellipse cx="159" cy="177" rx="30" ry="21" fill="${QTZ.belly}"/>
  <g class="wing-l"><path d="M120 146 Q96 162 104 192 Q128 184 136 160 Z" fill="${QTZ.wing}"/></g>
  <g class="wing-r"><path d="M198 146 Q222 162 214 192 Q190 184 182 160 Z" fill="${QTZ.wing}"/></g>
  <g class="head">
    <g class="sway-r"><path d="M138 66 Q146 36 166 28 Q160 46 174 38 Q172 54 186 54 Q174 70 138 66 Z" fill="${QTZ.body}"/></g>
    <ellipse cx="160" cy="110" rx="60" ry="50" fill="${QTZ.head}"/>
    <ellipse cx="117" cy="124" rx="9" ry="5.5" fill="${QTZ.cheeks}"/>
    <ellipse cx="203" cy="124" rx="9" ry="5.5" fill="${QTZ.cheeks}"/>
    ${eyes(state, [136, 106], [184, 106])}
    ${QTZ_BEAK[state === "celebrate" ? "open" : "closed"]}
  </g>
</g>`;
}

// ---------- Ensamble ----------
const MASCOTS = {
  axolotl: { name: "Ajolote", short: "Axo, un ajolote", draw: axolotl },
  jaguar: { name: "Jaguar", short: "Un jaguar", draw: jaguar },
  quetzal: { name: "Quetzal", short: "Un quetzal", draw: quetzal },
};

function svg(id, state) {
  const m = MASCOTS[id];
  const label = `${m.short} ${STATE_LABELS[state]}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 224" role="img" aria-label="${label}" class="anim st-${state}">
<title>${label}</title>
<style>${CSS}</style>
${shadow}${m.draw(state).trim()}
${marks(state)}
</svg>
`;
}

const manifest = { version: 1, viewBox: "0 0 320 224", default: "axolotl", states: STATES, mascots: {} };
for (const [id, m] of Object.entries(MASCOTS)) {
  mkdirSync(join(OUT, id), { recursive: true });
  const states = {};
  for (const state of STATES) {
    writeFileSync(join(OUT, id, `${state}.svg`), svg(id, state));
    // Rutas relativas a la raíz del repo (donde vive Axo.html), para que funcionen con file://
    states[state] = `mascots/${id}/${state}.svg`;
  }
  manifest.mascots[id] = { name: m.name, states, fallback: states.idle };
}
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Listo: ${Object.keys(MASCOTS).length} mascotas x ${STATES.length} estados en mascots/`);
