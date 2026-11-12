// Live behaviour for the EA888 evo4 stratified exploded view (_includes/gti-exploded-en.html).
// The drawing is static SVG built by _tools/gti/exploded/build.mjs; this script only moves each
// layer along the vertical axis, turns the assembled engine to the lean of the reference picture
// and back upright as it comes apart, fits the viewBox to the current pose and fills the detail panel.
(() => {
  // Where the shared geometry and kit modules live (assets/gti/xv/), relative to this script.
  const scriptUrl = document.currentScript && document.currentScript.src ? document.currentScript.src : null;
  const roots = document.querySelectorAll("[data-gti-xv]");
  roots.forEach(init);

  function init(root) {
    const data = JSON.parse(root.querySelector("[data-gti-xv-data]").textContent);
    const ui = data.ui;
    const svg = root.querySelector(".gti-xv-svg");
    const stage = root.querySelector(".gti-xv-stage");
    const panel = root.querySelector("[data-panel]");
    const toggle = root.querySelector("[data-toggle]");
    const slider = root.querySelector("[data-sep]");
    const readout = root.querySelector("[data-readout]");
    const picks = [...root.querySelectorAll("[data-pick]")];
    const order = data.layers.map((l) => l.id);
    const byId = Object.fromEntries(data.layers.map((l) => [l.id, l]));
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const groups = {};
    root.querySelectorAll("[data-layer]").forEach((g) => {
      groups[g.dataset.layer] = { g, move: g.querySelector("[data-move]"), dz: Number(g.dataset.dz), box: null };
    });
    const layerParent = svg.querySelector("[data-layer]").parentNode;
    const rollGroup = svg.querySelector("[data-roll]");
    const [px, py] = data.pivot || [0, 0];
    // Lean when assembled, upright once the layers are about half apart.
    // The lean belongs to the picture's view: it fades as the reader turns the engine away from it.
    const view = data.view || { azimuth: 0 };
    let az = view.azimuth;
    const turnedBy = () => ((((az - view.azimuth) % 360) + 540) % 360) - 180;
    const leanAt = (s) => {
      const t = Math.max(0, Math.min(1, s / 0.55));
      const w = Math.max(0, 1 - Math.abs(turnedBy()) / 40);
      return (data.roll || 0) * (1 - t * t * (3 - 2 * t)) * w * w * (3 - 2 * w);
    };
    const stackOrder = [...layerParent.querySelectorAll(":scope > [data-layer]")];

    let v = 0; // 0 assembled, 1 fully apart
    let rate = 0;
    let target = 0;
    let selected = null;
    let frame = 0;
    let last = 0;
    let visible = false;
    let shown = false;
    let flyFront = null;
    let pendingScroll = null;

    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Measure every layer with its apart-only parts shown. Assembled, the flywheel layer is hidden entirely, and a hidden
    // layer reports an empty box at the origin, which would stretch the frame up to the top of the drawing.
    function measure() {
      const assembledNow = root.hasAttribute("data-assembled");
      if (assembledNow) root.removeAttribute("data-assembled");
      for (const id in groups) {
        const b = groups[id].move.getBBox();
        groups[id].box = b.width > 0 || b.height > 0 ? [b.x, b.y, b.x + b.width, b.y + b.height] : null;
      }
      if (assembledNow) root.setAttribute("data-assembled", "");
    }

    function draw() {
      const [rx, ry] = data.rise;
      const lean = leanAt(v);
      const a = (lean * Math.PI) / 180;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      if (rollGroup) rollGroup.setAttribute("transform", `rotate(${lean.toFixed(3)} ${px} ${py})`);
      let x0 = Infinity;
      let x1 = -Infinity;
      let lo = Infinity;
      let hi = -Infinity;
      for (const id in groups) {
        const G = groups[id];
        const d = G.dz * v;
        G.move.setAttribute("transform", `translate(${(rx * d).toFixed(2)} ${(ry * d).toFixed(2)})`);
        if (G.box) {
          for (const x of [G.box[0] + rx * d, G.box[2] + rx * d]) {
            for (const y of [G.box[1] + ry * d, G.box[3] + ry * d]) {
              const tx = px + (x - px) * ca - (y - py) * sa;
              const ty = py + (x - px) * sa + (y - py) * ca;
              x0 = Math.min(x0, tx);
              x1 = Math.max(x1, tx);
              lo = Math.min(lo, ty);
              hi = Math.max(hi, ty);
            }
          }
        }
      }
      if (Number.isFinite(lo)) {
        const pad = data.pad;
        const left = Math.min(0, x0 - pad);
        const right = Math.max(data.width, x1 + pad);
        svg.setAttribute("viewBox", `${left.toFixed(1)} ${(lo - pad).toFixed(1)} ${(right - left).toFixed(1)} ${(hi - lo + pad * 2).toFixed(1)}`);
      }
      // Assembled, near-side parts (flywheel, turbocharger) are drawn over the block and head, far-side parts behind them.
      const assembled = v < 0.25;
      root.toggleAttribute("data-assembled", v < 0.04);
      if (assembled !== flyFront) {
        flyFront = assembled;
        // Layers that share a rank are ordered by the depth of their centres (data-depth), nearest last.
        const rank = (g) => (assembled ? { back: 0, over: 1.5, front: 2 }[g.dataset.assembled] ?? 1 : 1);
        const depth = (a, b) => (assembled && a.dataset.depth && b.dataset.depth ? Number(a.dataset.depth) - Number(b.dataset.depth) : 0);
        [...stackOrder].sort((a, b) => rank(a) - rank(b) || depth(a, b) || stackOrder.indexOf(a) - stackOrder.indexOf(b)).forEach((g) => layerParent.appendChild(g));
      }
      const pct = Math.round(v * 100);
      if (document.activeElement !== slider) slider.value = String(Math.round(target * 100));
      readout.textContent = selected ? `${String(order.indexOf(selected) + 1).padStart(2, "0")} · ${byId[selected].name}` : `${ui.separation} ${pct}%`;
    }

    function tick(now) {
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      if (still.matches) {
        v = target;
        rate = 0;
      } else {
        const stiff = 46;
        const drag = 2 * Math.sqrt(stiff) * 1.02;
        for (let i = 0; i < 4; i++) {
          rate += ((target - v) * stiff - rate * drag) * (dt / 4);
          v += rate * (dt / 4);
        }
        if (Math.abs(target - v) < 0.0005 && Math.abs(rate) < 0.0005) {
          v = target;
          rate = 0;
        }
      }
      draw();
      frame = v !== target || rate !== 0 ? requestAnimationFrame(tick) : 0;
      if (!frame && pendingScroll) reveal(pendingScroll);
    }
    const run = () => {
      if (!frame) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const setTarget = (t) => {
      target = Math.max(0, Math.min(1, t));
      toggle.textContent = target > 0.5 ? ui.assemble : ui.explode;
      toggle.setAttribute("aria-pressed", String(target > 0.5));
      run();
    };

    // ---------------------------------------------------------------- turning
    // The engine is redrawn from another side by the same geometry the build uses (assets/gti/xv/geometry.mjs with
    // the Anatomy kit). Views are drawn on demand in 5 degree steps and kept, so turning back is instant.
    const turnInput = root.querySelector("[data-turn]");
    const turnReset = root.querySelector("[data-turn-reset]");
    const views = new Map();
    let geometry = null;
    let wanted = az;
    let busy = false;
    const norm = (a) => (((Math.round(a / 5) * 5) % 360) + 360) % 360;
    // The same perspective camera as the build (build.mjs perspOf): distance view.distance from the engine centre.
    function perspAt(azimuth) {
      if (!view.distance) return undefined;
      const r = (azimuth * Math.PI) / 180;
      const e = (view.elevation * Math.PI) / 180;
      const [x, y, z] = view.centre || [0, 0, 120];
      return {
        D: view.distance,
        u: x * Math.sin(r) - y * Math.cos(r),
        v: (x * Math.cos(r) + y * Math.sin(r)) * Math.sin(e) - z * Math.cos(e),
        d: (x * Math.cos(r) + y * Math.sin(r)) * Math.cos(e) + z * Math.sin(e),
      };
    }
    function loadGeometry() {
      if (geometry) return geometry;
      const turn = data.turn || {};
      let urls;
      if (turn.inline) {
        const src = JSON.parse(document.querySelector("[data-gti-xv-modules]").textContent);
        const blob = (code) => URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
        const iso = blob(src.iso);
        const lathe = blob(src.lathe.split('"./iso-kit.mjs"').join(JSON.stringify(iso)));
        const tube = blob(src.tube.split('"./iso-kit.mjs"').join(JSON.stringify(iso)).split('"./lathe.mjs"').join(JSON.stringify(lathe)));
        urls = [iso, lathe, tube, blob(src.geometry)];
      } else {
        const base = new URL(turn.base || "xv/", scriptUrl || location.href);
        // the figure's own module carries this script's version query, so a rebuilt figure is never mixed with an old one
        const version = scriptUrl ? new URL(scriptUrl).search : "";
        urls = ["kit/iso-kit.mjs", "kit/lathe.mjs", "kit/tube.mjs", `geometry.mjs${version}`].map((f) => new URL(f, base).href);
      }
      geometry = Promise.all(urls.map((u) => import(u))).then(([k, G, TB, M]) => M.makeGeometry({ k, G, TB }));
      return geometry;
    }
    function remember(a) {
      if (views.has(a)) return;
      const svgOf = {};
      const ranks = {};
      const depths = {};
      for (const id in groups) {
        svgOf[id] = groups[id].move.innerHTML;
        if (groups[id].g.dataset.assembled) ranks[id] = groups[id].g.dataset.assembled;
        if (groups[id].g.dataset.depth) depths[id] = groups[id].g.dataset.depth;
      }
      views.set(a, { svgOf, ranks, depths });
    }
    async function drawn(a) {
      const hit = views.get(a);
      if (hit) return hit;
      const geo = await loadGeometry();
      const proj = { origin: view.origin, scale: view.scale, azimuth: a, elevation: view.elevation, persp: perspAt(a) };
      const { items } = geo.render(proj);
      const svgOf = {};
      for (const id in groups) svgOf[id] = items.filter((i) => i.layer === id).sort((p, q) => p.depth - q.depth).map((i) => i.svg).join("");
      const entry = { svgOf, ranks: geo.ranks(proj, order), depths: geo.sideDepths(proj, order) };
      views.set(a, entry);
      if (views.size > 16) {
        const first = views.keys().next().value;
        if (first !== view.azimuth) views.delete(first);
      }
      return entry;
    }
    async function turnTo(a) {
      wanted = norm(a);
      if (busy) return;
      busy = true;
      root.setAttribute("data-turning", "");
      try {
        remember(az);
        while (wanted !== az) {
          const next = wanted;
          const entry = await drawn(next);
          for (const id in groups) {
            groups[id].move.innerHTML = entry.svgOf[id];
            if (entry.ranks[id]) groups[id].g.dataset.assembled = entry.ranks[id];
            else delete groups[id].g.dataset.assembled;
            if (entry.depths[id] !== undefined) groups[id].g.dataset.depth = entry.depths[id];
          }
          az = next;
          measure();
          flyFront = null;
          draw();
          // yield to the page between views (a timer, not a frame: frames stop in background tabs)
          await new Promise((done) => setTimeout(done, 0));
        }
      } catch (error) {
        console.error("gti-xv: could not turn the figure", error);
      } finally {
        busy = false;
        root.removeAttribute("data-turning");
      }
      const by = turnedBy();
      if (turnInput && document.activeElement !== turnInput) turnInput.value = String(by);
      if (turnReset) turnReset.hidden = by === 0;
    }

    function renderPanel() {
      if (!selected) {
        panel.innerHTML = `<p class="gti-xv-empty">${esc(ui.empty)}</p><button type="button" class="gti-xv-start" data-go="${order[0]}">01 · ${esc(byId[order[0]].name)} →</button>`;
        return;
      }
      const i = order.indexOf(selected);
      const L = byId[selected];
      const prev = order[i - 1];
      const next = order[i + 1];
      const rows = L.specs
        .map((s) => `<tr><th scope="row">${esc(s.label)}</th><td><span class="gti-xv-value">${esc(s.value)}</span><span class="gti-xv-meta"><span class="gti-xv-kind" data-kind="${s.kind}" title="${esc(ui.kindHelp[s.kind])}">${esc(ui.kinds[s.kind])}</span><cite>${esc(s.src)}</cite></span></td></tr>`)
        .join("");
      panel.innerHTML = `
        <header class="gti-xv-head"><p class="gti-xv-eyebrow">${String(i + 1).padStart(2, "0")} / ${order.length}</p><button type="button" class="gti-xv-close" data-close aria-label="${esc(ui.close)}">×</button><h3>${esc(L.name)}</h3><p class="gti-xv-role">${esc(L.role)}</p></header>
        <table class="gti-xv-specs"><tbody>${rows}</tbody></table>
        <div class="gti-xv-notes">${L.notes.map((n) => `<p>${esc(n)}</p>`).join("")}</div>
        <nav class="gti-xv-step">
          <button type="button" data-go="${prev || ""}" ${prev ? "" : "disabled"}>← ${esc(ui.previous)}${prev ? `<small>${esc(byId[prev].name)}</small>` : ""}</button>
          <button type="button" data-go="${next || ""}" ${next ? "" : "disabled"}>${esc(ui.next)} →${next ? `<small>${esc(byId[next].name)}</small>` : ""}</button>
        </nav>`;
      panel.scrollTop = 0;
    }

    // Bring a layer into the part of the screen the panel does not cover.
    function reveal(id) {
      pendingScroll = null;
      const G = groups[id];
      if (!G) return;
      const box = G.g.getBoundingClientRect();
      const sheet = getComputedStyle(panel).position === "sticky" && getComputedStyle(panel).bottom === "0px";
      const top = 72;
      const bottom = sheet ? innerHeight - panel.getBoundingClientRect().height - 12 : innerHeight - 16;
      if (box.top >= top && box.bottom <= bottom) return;
      const centre = box.top + box.height / 2;
      const aim = sheet ? top + (bottom - top) * 0.45 : innerHeight * 0.45;
      scrollTo({ top: scrollY + centre - aim, behavior: still.matches ? "auto" : "smooth" });
    }

    function select(id, { focusStage = false, scroll = true } = {}) {
      selected = id && byId[id] ? id : null;
      if (selected) root.setAttribute("data-selected", selected);
      else root.removeAttribute("data-selected");
      for (const key in groups) groups[key].g.toggleAttribute("data-active", key === selected);
      picks.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pick === selected)));
      // On narrow screens the layer list is one scrolling row: keep the active chip in it.
      const chip = picks.find((b) => b.dataset.pick === selected);
      const row = chip && chip.closest("ol");
      if (row && row.scrollWidth > row.clientWidth + 1) {
        const a = chip.getBoundingClientRect();
        const r = row.getBoundingClientRect();
        row.scrollTo({ left: row.scrollLeft + a.left - r.left - (r.width - a.width) / 2, behavior: still.matches ? "auto" : "smooth" });
      }
      const moving = selected && target < 0.5;
      if (moving) setTarget(1);
      renderPanel();
      draw();
      if (selected && scroll) {
        if (moving || frame) pendingScroll = selected;
        else reveal(selected);
      }
      if (focusStage) stage.focus({ preventScroll: true });
    }
    const step = (by) => {
      const i = selected ? order.indexOf(selected) : -1;
      const j = Math.max(0, Math.min(order.length - 1, i + by));
      select(order[j]);
    };

    svg.addEventListener("click", (event) => {
      if (dragged) {
        dragged = false;
        return;
      }
      const g = event.target.closest("[data-layer]");
      if (g) select(g.dataset.layer === selected ? null : g.dataset.layer, { scroll: false });
    });
    panel.addEventListener("click", (event) => {
      if (event.target.closest("[data-close]")) return select(null);
      const b = event.target.closest("[data-go]");
      if (b && b.dataset.go) select(b.dataset.go);
    });
    picks.forEach((b) => b.addEventListener("click", () => select(b.dataset.pick)));
    toggle.addEventListener("click", () => setTarget(target > 0.5 ? 0 : 1));
    slider.addEventListener("input", () => setTarget(Number(slider.value) / 100));
    if (turnInput) turnInput.addEventListener("input", () => turnTo(view.azimuth + Number(turnInput.value)));
    if (turnReset) turnReset.addEventListener("click", () => { if (turnInput) turnInput.value = "0"; turnTo(view.azimuth); });
    // Drag sideways on the figure to turn it; a short tap still selects a part.
    let drag = null;
    let dragged = false;
    stage.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      drag = { x: event.clientX, from: az, id: event.pointerId };
      dragged = false;
    });
    stage.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      if (!dragged && Math.abs(dx) < 6) return;
      if (!dragged) {
        dragged = true;
        stage.setPointerCapture(event.pointerId);
      }
      const to = drag.from - dx * 0.6;
      if (turnInput) turnInput.value = String(((((to - view.azimuth) % 360) + 540) % 360) - 180);
      turnTo(to);
    });
    const endDrag = () => { drag = null; };
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("keydown", (event) => {
      const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      if (event.key in keys) {
        event.preventDefault();
        step(keys[event.key]);
      } else if (event.key === "Home") {
        event.preventDefault();
        select(order[0]);
      } else if (event.key === "End") {
        event.preventDefault();
        select(order[order.length - 1]);
      } else if (event.key === "Escape") {
        select(null);
      }
    });

    measure();
    renderPanel();
    draw();
    new IntersectionObserver(
      (entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible && !shown) {
          shown = true;
          // First view: the layers come apart once, then the reader drives.
          setTimeout(() => setTarget(1), still.matches ? 0 : 450);
        }
      },
      { threshold: 0.12 },
    ).observe(stage);
  }
})();
