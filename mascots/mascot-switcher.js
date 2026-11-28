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

  function sync(svg) {
    // La vista previa de la tienda siempre muestra al ajolote con su ropa.
    if (svg.closest(".customization-stage")) return;
    let img = svg.nextElementSibling;
    if (!img || !img.classList.contains("mascot-alt")) img = null;

    if (current === "axolotl") {
      svg.style.removeProperty("display");
      img?.remove();
      return;
    }
    const state = stateOf(svg);
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
  }

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
    document.body.append(buildPicker());
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
