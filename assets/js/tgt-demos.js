/* =============================================================================
 * tgt-demos.js — interactive figures for
 * "Discovering Mechanisms in Tokenized Graph Transformers"
 *
 * Zero-dependency vanilla JS + inline SVG + <canvas>. Graphs are live
 * force-simulated (draggable, hover-reactive). Demo-native visuals (animated
 * ring gauges, node glows, flowing copy-arrows) replace static paper plots.
 * Each demo mounts on <div data-tgt-demo="..."> and lazy-loads its JSON.
 * ========================================================================== */
(function () {
  "use strict";

  var BASE = "/assets/json/tgt-demos/";
  var SVGNS = "http://www.w3.org/2000/svg";

  var CRIMSON = [165, 0, 52];   // #a50034
  var INDIGO = [45, 46, 131];   // #2d2e83
  var WHITE = [255, 255, 255];
  var C_INDIGO = "#2d2e83", C_CRIMSON = "#a50034";

  // ---- colour helpers -----------------------------------------------------
  function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
  function mix(a, b, t) {
    return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  }
  function rgb(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }
  function diverging(v, vmax) {
    if (!vmax) return rgb(WHITE);
    var t = clamp(v / vmax, -1, 1);
    return t >= 0 ? rgb(mix(WHITE, INDIGO, t)) : rgb(mix(WHITE, CRIMSON, -t));
  }
  function sequential(v, vmax) {
    if (!vmax) return "#fafbff";
    var t = clamp(v / vmax, 0, 1);
    if (t < 0.004) return "#fafbff";
    return rgb(mix(WHITE, INDIGO, Math.pow(t, 0.55)));
  }
  function nodePredColor(d, i) {
    var p = d.predictions;
    if (p && p.type === "node" && p.labels && p.predictions) {
      return p.predictions[i] === p.labels[i]
        ? { fill: "#a8e6b8", stroke: "#1a7a30" }
        : { fill: "#f5b0b0", stroke: "#c00" };
    }
    return { fill: "#d0e4ff", stroke: "#2a4a80" };
  }

  // ---- DOM helpers --------------------------------------------------------
  function el(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (kids) kids.forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  var cache = {};
  function getJSON(name) {
    if (!cache[name]) cache[name] = fetch(BASE + name).then(function (r) { return r.json(); });
    return cache[name];
  }
  function whenVisible(node, cb) {
    if (!("IntersectionObserver" in window)) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.disconnect(); cb(); } });
    }, { rootMargin: "200px" });
    io.observe(node);
  }
  function figure(root, title) {
    root.innerHTML = ""; root.classList.add("tgt");
    var fig = h("div", { class: "tgt-fig" });
    if (title) fig.appendChild(h("div", { class: "tgt-fig-title", text: title }));
    root.appendChild(fig);
    return fig;
  }
  function selectCtl(label, options, onchange, initial) {
    var sel = h("select", { class: "tgt-select" });
    options.forEach(function (o) {
      var opt = h("option", { value: o.value, text: o.label });
      if (o.value === initial) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", function () { onchange(sel.value); });
    return h("label", { class: "tgt-ctl" }, [h("span", { text: label }), sel]);
  }

  // ---- shared floating tooltip -------------------------------------------
  var tip = null;
  function showTip(x, y, html) {
    if (!tip) { tip = h("div", { class: "tgt-tip" }); document.body.appendChild(tip); }
    tip.innerHTML = html; tip.style.display = "block";
    tip.style.left = (x + 14) + "px"; tip.style.top = (y + 14) + "px";
  }
  function hideTip() { if (tip) tip.style.display = "none"; }

  // ---- graph seeding (connected components, min-spacing shelf pack) --------
  function components(n, edges) {
    var adj = [], i;
    for (i = 0; i < n; i++) adj.push([]);
    edges.forEach(function (e) { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); });
    var seen = new Array(n).fill(false), comps = [];
    for (var s = 0; s < n; s++) {
      if (seen[s]) continue;
      var q = [s], c = []; seen[s] = true;
      while (q.length) { var u = q.pop(); c.push(u); adj[u].forEach(function (v) { if (!seen[v]) { seen[v] = true; q.push(v); } }); }
      comps.push(c);
    }
    return comps;
  }
  function frLayout(nodes, edges) {
    var n = nodes.length, i, idx = {};
    nodes.forEach(function (g, li) { idx[g] = li; });
    function rnd(s) { var x = Math.sin(s * 999.13) * 43758.5453; return x - Math.floor(x); }
    var pos = [];
    for (i = 0; i < n; i++) {
      var a = (2 * Math.PI * i) / n;
      pos.push([0.4 * Math.cos(a) + (rnd(i + 1) - 0.5) * 0.05, 0.4 * Math.sin(a) + (rnd(i + 7) - 0.5) * 0.05]);
    }
    if (n === 1) return { pos: [[0.5, 0.5]], dmin: 1 };
    var local = edges.filter(function (e) { return idx[e[0]] != null && idx[e[1]] != null; })
      .map(function (e) { return [idx[e[0]], idx[e[1]]]; });
    var k = 1.3 * Math.sqrt(1 / n);
    for (var it = 0; it < 300; it++) {
      var disp = [];
      for (i = 0; i < n; i++) disp.push([0, 0]);
      for (i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
        var dx = pos[i][0] - pos[j][0], dy = pos[i][1] - pos[j][1];
        var d = Math.sqrt(dx * dx + dy * dy) || 0.001;
        var f = (k * k) / d + (k * k * k) / (d * d);
        var ux = dx / d, uy = dy / d;
        disp[i][0] += ux * f; disp[i][1] += uy * f; disp[j][0] -= ux * f; disp[j][1] -= uy * f;
      }
      for (var e = 0; e < local.length; e++) {
        var u = local[e][0], v = local[e][1];
        var ex = pos[u][0] - pos[v][0], ey = pos[u][1] - pos[v][1];
        var ed = Math.sqrt(ex * ex + ey * ey) || 0.001;
        var af = (ed * ed) / k, ax = (ex / ed) * af, ay = (ey / ed) * af;
        disp[u][0] -= ax; disp[u][1] -= ay; disp[v][0] += ax; disp[v][1] += ay;
      }
      var temp = 0.1 * (1 - it / 300) + 0.004;
      for (i = 0; i < n; i++) {
        var dl = Math.sqrt(disp[i][0] * disp[i][0] + disp[i][1] * disp[i][1]) || 0.001;
        pos[i][0] += (disp[i][0] / dl) * Math.min(dl, temp);
        pos[i][1] += (disp[i][1] / dl) * Math.min(dl, temp);
      }
    }
    var minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    pos.forEach(function (p) { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); });
    var sp = Math.max(maxx - minx, maxy - miny) || 1;
    pos = pos.map(function (p) { return [(p[0] - minx) / sp, (p[1] - miny) / sp]; });
    var dmin = Infinity;
    for (i = 0; i < n; i++) for (var jj = i + 1; jj < n; jj++) {
      var a1 = pos[i][0] - pos[jj][0], b1 = pos[i][1] - pos[jj][1];
      var dd = Math.sqrt(a1 * a1 + b1 * b1); if (dd < dmin) dmin = dd;
    }
    if (!isFinite(dmin) || dmin <= 0) dmin = 1;
    return { pos: pos, dmin: dmin };
  }
  function seedLayout(n, edges, w, ht, pad) {
    pad = pad || 20;
    var TARGET = 40, GAP = 26;
    var comps = components(n, edges);
    comps.sort(function (a, b) { return b.length - a.length; });
    var items = comps.map(function (c) {
      var r = frLayout(c, edges);
      var xs = r.pos.map(function (p) { return p[0]; }), ys = r.pos.map(function (p) { return p[1]; });
      var mnx = Math.min.apply(null, xs), mxx = Math.max.apply(null, xs);
      var mny = Math.min.apply(null, ys), mxy = Math.max.apply(null, ys);
      var s = TARGET / r.dmin;
      return { comp: c, pos: r.pos, minx: mnx, miny: mny, s: s, bw: (mxx - mnx) * s, bh: (mxy - mny) * s };
    });
    var availW = w - 2 * pad, availH = ht - 2 * pad;
    var x = 0, y = 0, rowH = 0, packW = 0;
    items.forEach(function (it) {
      var bw = it.bw + GAP, bh = it.bh + GAP;
      if (x + bw > availW && x > 0) { y += rowH; x = 0; rowH = 0; }
      it.px = x; it.py = y; x += bw; rowH = Math.max(rowH, bh); packW = Math.max(packW, x);
    });
    var packH = y + rowH;
    var factor = Math.min(1, availW / (packW || 1), availH / (packH || 1));
    var offX = pad + (availW - packW * factor) / 2, offY = pad + (availH - packH * factor) / 2;
    var out = new Array(n);
    items.forEach(function (it) {
      it.comp.forEach(function (g, li) {
        var pxx = it.px + GAP / 2 + (it.pos[li][0] - it.minx) * it.s;
        var pyy = it.py + GAP / 2 + (it.pos[li][1] - it.miny) * it.s;
        out[g] = [offX + pxx * factor, offY + pyy * factor];
      });
    });
    return out;
  }
  function scalePositions(nodes, positions, w, ht, pad) {
    pad = pad || 30;
    var xs = nodes.map(function (k) { return positions[k][0]; });
    var ys = nodes.map(function (k) { return positions[k][1]; });
    var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs);
    var miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
    var s = Math.min((w - 2 * pad) / (maxx - minx || 1), (ht - 2 * pad) / (maxy - miny || 1));
    var out = {};
    nodes.forEach(function (k) { out[k] = [pad + (positions[k][0] - minx) * s, ht - pad - (positions[k][1] - miny) * s]; });
    return out;
  }

  /* =======================================================================
   * GraphView — live force-simulated, draggable, hover-reactive graph
   * ===================================================================== */
  function GraphView(opts) {
    var self = this;
    var W = opts.width, H = opts.height, n = opts.n, edges = opts.edges;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, class: "tgt-graph tgt-graph-live" });
    this.svg = svg;
    var gEdges = el("g"), gArrows = el("g"), gNodes = el("g"), gLabels = el("g");
    svg.appendChild(gEdges); svg.appendChild(gArrows); svg.appendChild(gNodes); svg.appendChild(gLabels);

    var seed = opts.positions || seedLayout(n, edges, W, H);
    var x = [], y = [], vx = [], vy = [], radii = [];
    for (var i = 0; i < n; i++) { x[i] = seed[i][0]; y[i] = seed[i][1]; vx[i] = 0; vy[i] = 0; radii[i] = opts.radius || 8; }
    this.x = x; this.y = y;

    var L = Math.max(38, 0.5 * Math.sqrt(W * H / Math.max(n, 1)));
    var CH = L * L * 3.2, GRAV = 0.025, DAMP = 0.85;

    // create edge / node / label elements once
    var edgeEls = edges.map(function () { var e = el("line", { class: "tgt-edge" }); gEdges.appendChild(e); return e; });
    var nodeEls = [], labelEls = [];
    for (i = 0; i < n; i++) {
      var c = el("circle", { class: "tgt-node" }); gNodes.appendChild(c); nodeEls.push(c);
      var t = el("text", { class: "tgt-node-lab", "text-anchor": "middle" }); gLabels.appendChild(t); labelEls.push(t);
    }
    // arrow pool
    var arrowPool = [];
    function ensureArrows(k) {
      while (arrowPool.length < k) {
        var ln = el("line", { class: "tgt-arrow" }); var hd = el("polygon", { class: "tgt-arrowhead" });
        gArrows.appendChild(ln); gArrows.appendChild(hd); arrowPool.push({ ln: ln, hd: hd });
      }
    }
    var arrowList = [];
    this.setArrows = function (list) { arrowList = list || []; wake(); };

    var hovered = null, pinned = null, dragging = false, asleep = false, raf = null;
    this.hovered = function () { return hovered; };

    function toSvg(evt) {
      var pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
      var p = pt.matrixTransform(svg.getScreenCTM().inverse()); return [p.x, p.y];
    }
    function pick(px, py) {
      var best = null, bd = Infinity;
      for (var i = 0; i < n; i++) {
        var dx = px - x[i], dy = py - y[i], d = dx * dx + dy * dy;
        var rr = (radii[i] + 6) * (radii[i] + 6);
        if (d < rr && d < bd) { bd = d; best = i; }
      }
      return best;
    }
    svg.addEventListener("pointermove", function (evt) {
      var p = toSvg(evt);
      if (dragging && pinned != null) { x[pinned] = p[0]; y[pinned] = p[1]; vx[pinned] = 0; vy[pinned] = 0; wake(); }
      var hit = pick(p[0], p[1]);
      if (hit !== hovered) { hovered = hit; svg.style.cursor = hit != null ? "grab" : "default"; if (opts.onHover) opts.onHover(hit); draw(); }
    });
    svg.addEventListener("pointerdown", function (evt) {
      var p = toSvg(evt); var hit = pick(p[0], p[1]);
      if (hit != null) { pinned = hit; dragging = true; svg.style.cursor = "grabbing"; svg.setPointerCapture(evt.pointerId); if (opts.onSelect) opts.onSelect(hit); wake(); }
    });
    function endDrag() { dragging = false; pinned = null; svg.style.cursor = hovered != null ? "grab" : "default"; }
    svg.addEventListener("pointerup", endDrag);
    svg.addEventListener("pointercancel", endDrag);
    svg.addEventListener("pointerleave", function () { if (hovered !== null) { hovered = null; if (opts.onHover) opts.onHover(null); draw(); } });

    function step() {
      var i, j;
      var fx = new Float64Array(n), fy = new Float64Array(n);
      for (i = 0; i < n; i++) { fx[i] += (W / 2 - x[i]) * GRAV; fy[i] += (H / 2 - y[i]) * GRAV; }
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
        var dx = x[i] - x[j], dy = y[i] - y[j], d2 = dx * dx + dy * dy || 0.01, d = Math.sqrt(d2);
        var f = CH / d2, ux = dx / d, uy = dy / d;
        fx[i] += ux * f; fy[i] += uy * f; fx[j] -= ux * f; fy[j] -= uy * f;
        var minD = radii[i] + radii[j] + 6;
        if (d < minD) { var push = (minD - d) * 0.5; fx[i] += ux * push; fy[i] += uy * push; fx[j] -= ux * push; fy[j] -= uy * push; }
      }
      edges.forEach(function (ed) {
        var u = ed[0], v = ed[1];
        var dx = x[v] - x[u], dy = y[v] - y[u], d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var f = (d - L) * 0.06, ux = dx / d, uy = dy / d;
        fx[u] += ux * f; fy[u] += uy * f; fx[v] -= ux * f; fy[v] -= uy * f;
      });
      var energy = 0;
      for (i = 0; i < n; i++) {
        if (i === pinned) { vx[i] = 0; vy[i] = 0; continue; }
        vx[i] = (vx[i] + fx[i]) * DAMP; vy[i] = (vy[i] + fy[i]) * DAMP;
        var sp = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]); if (sp > 12) { vx[i] *= 12 / sp; vy[i] *= 12 / sp; }
        x[i] = clamp(x[i] + vx[i], 12, W - 12); y[i] = clamp(y[i] + vy[i], 12, H - 12);
        energy += vx[i] * vx[i] + vy[i] * vy[i];
      }
      return energy;
    }
    function draw() {
      // radii from style
      for (var i = 0; i < n; i++) { var st = opts.nodeStyle(i, i === hovered); radii[i] = st.r || 8; nodeEls[i]._st = st; }
      edges.forEach(function (ed, k) {
        var st = opts.edgeStyle ? opts.edgeStyle(k, ed[0], ed[1], hovered) : { stroke: "#b0b8cc", width: 1.5 };
        var e = edgeEls[k];
        e.setAttribute("x1", x[ed[0]]); e.setAttribute("y1", y[ed[0]]);
        e.setAttribute("x2", x[ed[1]]); e.setAttribute("y2", y[ed[1]]);
        e.setAttribute("stroke", st.stroke); e.setAttribute("stroke-width", st.width);
        e.setAttribute("stroke-linecap", "round");
        e.setAttribute("opacity", st.opacity == null ? 1 : st.opacity);
      });
      // arrows
      ensureArrows(arrowList.length);
      arrowPool.forEach(function (ap, k) {
        if (k >= arrowList.length) { ap.ln.style.display = "none"; ap.hd.style.display = "none"; return; }
        ap.ln.style.display = ""; ap.hd.style.display = "";
        var ar = arrowList[k];
        var a = [x[ar.from], y[ar.from]], b = [x[ar.to], y[ar.to]];
        var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
        var bx = b[0] - ux * (radii[ar.to] + 3), by = b[1] - uy * (radii[ar.to] + 3);
        var ax = a[0] + ux * (radii[ar.from] + 1), ay = a[1] + uy * (radii[ar.from] + 1);
        ap.ln.setAttribute("x1", ax); ap.ln.setAttribute("y1", ay); ap.ln.setAttribute("x2", bx); ap.ln.setAttribute("y2", by);
        ap.ln.setAttribute("stroke", ar.color); ap.ln.setAttribute("stroke-width", ar.width || 2);
        ap.ln.setAttribute("opacity", ar.opacity == null ? 0.9 : ar.opacity);
        ap.ln.setAttribute("class", "tgt-arrow" + (ar.flow ? " tgt-flow" : ""));
        var s = 7, wdt = 4, px = -uy, py = ux, cxb = bx - ux * s, cyb = by - uy * s;
        ap.hd.setAttribute("points", bx + "," + by + " " + (cxb + px * wdt) + "," + (cyb + py * wdt) + " " + (cxb - px * wdt) + "," + (cyb - py * wdt));
        ap.hd.setAttribute("fill", ar.color); ap.hd.setAttribute("opacity", ar.opacity == null ? 0.9 : ar.opacity);
      });
      for (var i = 0; i < n; i++) {
        var st = nodeEls[i]._st, c = nodeEls[i];
        c.setAttribute("cx", x[i]); c.setAttribute("cy", y[i]); c.setAttribute("r", radii[i]);
        c.setAttribute("fill", st.fill); c.setAttribute("stroke", st.stroke); c.setAttribute("stroke-width", st.sw || 1.2);
        var t = labelEls[i];
        if (st.label == null) { t.style.display = "none"; }
        else {
          t.style.display = ""; t.setAttribute("x", x[i]); t.setAttribute("y", y[i] + 3);
          t.textContent = st.label; t.setAttribute("fill", st.labelFill || "#1a2a4a");
        }
      }
    }
    this.redraw = draw;
    function loop() {
      var e = step(); draw();
      if (e < 0.03 && !dragging) { asleep = true; raf = null; return; }
      raf = requestAnimationFrame(loop);
    }
    function wake() { if (asleep || raf == null) { asleep = false; if (raf == null) raf = requestAnimationFrame(loop); } }
    this.wake = wake;
    // initial settle
    raf = requestAnimationFrame(loop);
    draw();
  }

  // ---- animated ring gauge (HTML/SVG, CSS transition) ---------------------
  function ringGauge(label, color) {
    var R = 42, C = 2 * Math.PI * R;
    var fg = el("circle", { class: "tgt-gauge-fg", cx: 50, cy: 50, r: R, fill: "none", stroke: color || C_INDIGO,
      "stroke-width": 9, "stroke-linecap": "round", transform: "rotate(-90 50 50)",
      "stroke-dasharray": C.toFixed(1), "stroke-dashoffset": C.toFixed(1) });
    var svg = el("svg", { viewBox: "0 0 100 100", class: "tgt-gauge-svg" });
    svg.appendChild(el("circle", { cx: 50, cy: 50, r: R, fill: "none", stroke: "#ececf3", "stroke-width": 9 }));
    svg.appendChild(fg);
    var val = h("div", { class: "tgt-gauge-val", text: "\u2013" });
    var lab = h("div", { class: "tgt-gauge-lab", text: label });
    var wrap = h("div", { class: "tgt-gauge" }, [svg, val, lab]);
    return {
      el: wrap,
      set: function (v, text) { fg.setAttribute("stroke-dashoffset", (C * (1 - clamp(v, 0, 1))).toFixed(1)); val.textContent = text; }
    };
  }

  // ---- horizontal marker track (e.g. mean predicted degree) ---------------
  function markerTrack(labels) {
    var line = h("div", { class: "tgt-track-line" });
    var dot = h("div", { class: "tgt-track-dot" });
    var labRow = h("div", { class: "tgt-track-labels" }, labels.map(function (l) { return h("span", { text: l }); }));
    var track = h("div", { class: "tgt-track" }, [line, dot, labRow]);
    return { el: track, set: function (frac) { dot.style.left = (clamp(frac, 0, 1) * 100) + "%"; } };
  }

  // ---- pill row (e.g. per-distance accuracy as glowing dots) --------------
  function pillRow(labels) {
    var pills = labels.map(function (l) {
      var dot = h("div", { class: "tgt-pill-dot" });
      return { dot: dot, el: h("div", { class: "tgt-pill" }, [dot, h("span", { class: "tgt-pill-lab", text: l })]) };
    });
    var row = h("div", { class: "tgt-pillrow" }, pills.map(function (p) { return p.el; }));
    return {
      el: row,
      set: function (vals) { pills.forEach(function (p, i) { p.dot.style.background = sequential(vals[i], 1); p.dot.title = (vals[i] * 100).toFixed(1) + "%"; }); }
    };
  }

  // ---- canvas heatmap -----------------------------------------------------
  // opts.rowLabels / opts.colLabels : arrays of strings drawn outside the grid.
  function drawHeatmap(canvas, matrix, opts) {
    opts = opts || {};
    var n = matrix.length, m = matrix[0].length;
    var cell = opts.cell || Math.max(8, Math.floor(360 / Math.max(n, m)));
    var mL = opts.rowLabels ? (opts.margin || 46) : 0;
    var mT = opts.colLabels ? (opts.margin || 46) : 0;
    canvas.width = mL + m * cell; canvas.height = mT + n * cell;
    canvas.style.width = canvas.width + "px"; canvas.style.height = canvas.height + "px";
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var vmax = opts.vmax;
    if (vmax == null) { vmax = 0; for (var a = 0; a < n; a++) for (var b = 0; b < m; b++) { var val = opts.diverging ? Math.abs(matrix[a][b]) : matrix[a][b]; if (val > vmax) vmax = val; } }
    for (var i = 0; i < n; i++) for (var j = 0; j < m; j++) {
      ctx.fillStyle = opts.diverging ? diverging(matrix[i][j], vmax) : sequential(matrix[i][j], vmax);
      ctx.fillRect(mL + j * cell, mT + i * cell, cell, cell);
    }
    if (cell >= 9) {
      ctx.strokeStyle = "rgba(0,0,0,0.06)"; ctx.lineWidth = 0.5;
      for (var gi = 0; gi <= n; gi++) { ctx.beginPath(); ctx.moveTo(mL, mT + gi * cell); ctx.lineTo(mL + m * cell, mT + gi * cell); ctx.stroke(); }
      for (var gj = 0; gj <= m; gj++) { ctx.beginPath(); ctx.moveTo(mL + gj * cell, mT); ctx.lineTo(mL + gj * cell, mT + n * cell); ctx.stroke(); }
    }
    if (opts.split) {
      ctx.strokeStyle = "rgba(60,60,60,0.45)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(mL + opts.split * cell, mT); ctx.lineTo(mL + opts.split * cell, mT + n * cell); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mL, mT + opts.split * cell); ctx.lineTo(mL + m * cell, mT + opts.split * cell); ctx.stroke();
    }
    if (opts.focusRow != null) { ctx.strokeStyle = "rgba(200,0,0,0.65)"; ctx.lineWidth = 2; ctx.strokeRect(mL, mT + opts.focusRow * cell, m * cell, cell); }
    if (opts.focusCol != null) { ctx.strokeStyle = "rgba(200,0,0,0.65)"; ctx.lineWidth = 2; ctx.strokeRect(mL + opts.focusCol * cell, mT, cell, n * cell); }
    
    // SVG overlay for crisp text labels
    if (opts.svgOverlay) {
      var svg = opts.svgOverlay;
      svg.innerHTML = "";
      svg.setAttribute("viewBox", "0 0 " + canvas.width + " " + canvas.height);
      svg.style.width = canvas.width + "px"; svg.style.height = canvas.height + "px";
      function labClass(lbl, foc) { return "tgt-heat-lab " + (lbl && lbl.charAt(0) === "E" ? "edge" : "node") + (foc ? " foc" : ""); }
      if (opts.colLabels) {
        for (var cj = 0; cj < m; cj++) {
          var tx = mL + cj * cell + cell / 2 + 3, ty = mT - 4;
          var t1 = el("text", { x: tx, y: ty, class: labClass(opts.colLabels[cj], opts.focusCol === cj), transform: "rotate(-60 " + tx + " " + ty + ")" });
          t1.textContent = opts.colLabels[cj]; svg.appendChild(t1);
        }
      }
      if (opts.rowLabels) {
        for (var ci = 0; ci < n; ci++) {
          var t2 = el("text", { x: mL - 4, y: mT + ci * cell + cell / 2 + 3, class: labClass(opts.rowLabels[ci], opts.focusRow === ci), "text-anchor": "end" });
          t2.textContent = opts.rowLabels[ci]; svg.appendChild(t2);
        }
      }
    }
    
    canvas._cell = cell; canvas._mL = mL; canvas._mT = mT; canvas._vmax = vmax;
    return { cell: cell, vmax: vmax };
  }
  function colorbar(diverge) {
    var c = document.createElement("canvas"); c.width = 140; c.height = 12; c.className = "tgt-colorbar";
    var ctx = c.getContext("2d");
    for (var x = 0; x < 140; x++) { var t = x / 139; ctx.fillStyle = diverge ? diverging(t * 2 - 1, 1) : sequential(t, 1); ctx.fillRect(x, 0, 1, 12); }
    return c;
  }

  function buildSchematic(headsArr, l1cellsArr, activeL, activeH, resActive, activeEntireL) {
    var schem = h("div", { class: "tgt-schem" });
    var hLabs = h("div", { class: "tgt-schem-h-labs" });
    for (var hi = 0; hi < 8; hi++) hLabs.appendChild(h("div", { class: "tgt-schem-h-lab", text: hi }));
    schem.appendChild(hLabs);
    for (var l = 3; l >= 0; l--) {
      var row = h("div", { class: "tgt-schem-l" });
      row.appendChild(h("div", { class: "tgt-schem-l-lab", text: "L" + l }));
      for (var hi = 0; hi < 8; hi++) {
        var cell = h("div", { class: "tgt-schem-h" });
        if ((activeL === l && activeH === hi) || activeEntireL === l) cell.className = "tgt-schem-h active";
        if (headsArr) headsArr.push({ l: l, h: hi, el: cell });
        if (l1cellsArr && l === 1) l1cellsArr.push(cell);
        row.appendChild(cell);
      }
      schem.appendChild(row);
    }
    if (resActive) {
      var resRow = h("div", { class: "tgt-schem-l" });
      resRow.appendChild(h("div", { class: "tgt-schem-l-lab", text: "res" }));
      resRow.appendChild(h("div", { class: "tgt-schem-h active-res", style: "width:110px; height:4px;" }));
      schem.appendChild(resRow);
    }
    return schem;
  }

  /* =======================================================================
   * Demo 1 — Attention & identifier-matching explorer
   * ===================================================================== */
  function initAttention(root) {
    var fig = figure(root, "Attention & identifier matching");
    var controls = h("div", { class: "tgt-controls" });
    
    var heads = [];
    var schem = buildSchematic(heads, null, null, null, false, null);
    controls.appendChild(schem);

    var stage = h("div", { class: "tgt-stage" });
    var heatWrap = h("div", { class: "tgt-panel" });
    var graphWrap = h("div", { class: "tgt-panel" });
    var info = h("div", { class: "tgt-info" });
    var canvas = h("canvas", { class: "tgt-canvas" });
    var svgOverlay = el("svg", { class: "tgt-heat-svg" });
    var heatInner = h("div", { class: "tgt-heat-inner" }, [canvas, svgOverlay]);
    heatWrap.appendChild(h("div", { class: "tgt-cap", text: "token \u2192 token attention \u00b7 hover cells, click a node row" }));
    heatWrap.appendChild(heatInner);
    graphWrap.appendChild(h("div", { class: "tgt-cap", text: "hover / drag nodes \u2014 overlay shows attention from the query node" }));
    stage.appendChild(heatWrap); stage.appendChild(graphWrap);
    fig.appendChild(controls); fig.appendChild(stage); fig.appendChild(info);

    var state = { task: "degree", layer: 0, head: 0, query: 0, data: null, view: null, edgeW: {}, rowMax: 1, hoverEdge: null, hoverCol: null };

    controls.appendChild(selectCtl("task", [
      { value: "degree", label: "degree counting" }, { value: "ring", label: "ring membership" }, { value: "spd", label: "shortest path" },
    ], function (v) { load(v); }, state.task));
    controls.appendChild(selectCtl("layer", [0, 1, 2, 3].map(function (l) { return { value: String(l), label: "L" + l }; }), function (v) { state.layer = +v; recompute(); }, "0"));
    controls.appendChild(selectCtl("head", [0, 1, 2, 3, 4, 5, 6, 7].map(function (l) { return { value: String(l), label: "H" + l }; }), function (v) { state.head = +v; recompute(); }, "0"));

    function mat() { return state.data.attention[String(state.layer)][state.head]; }
    function tokLabel(i) { return state.data.tokens[i].label; }
    function tokLabels() { return state.data.tokens.map(function (t) { return t.label; }); }

    function recompute() {
      if (!state.data) return;
      var d = state.data, M = mat(), q = state.query;
      state.edgeW = {}; state.rowMax = 0;
      var incident = 0, self = M[q][q], nodeMass = 0;
      for (var ri = 0; ri < M[q].length; ri++) if (ri !== q && M[q][ri] > state.rowMax) state.rowMax = M[q][ri];
      if (state.rowMax < 1e-6) state.rowMax = 1;
      d.tokens.forEach(function (t, idx) {
        if (t.type === "edge") { state.edgeW[t.u + "-" + t.v] = M[q][idx]; if (t.u === q || t.v === q) incident += M[q][idx]; }
        else if (idx !== q) nodeMass += M[q][idx];
      });
      drawHeatmap(canvas, M, { diverging: false, split: d.num_nodes, focusRow: q, focusCol: state.hoverCol, rowLabels: tokLabels(), colLabels: tokLabels(), svgOverlay: svgOverlay });
      if (state.view) state.view.redraw();
      
      heads.forEach(function (hc) {
        if (hc.l === state.layer && hc.h === state.head) hc.el.className = "tgt-schem-h active";
        else hc.el.className = "tgt-schem-h";
      });

      // info
      info.innerHTML = "";
      var predStr = d.predictions.type === "node" ? (" \u00b7 label " + d.predictions.labels[q] + " / pred " + d.predictions.predictions[q]) : "";
      info.appendChild(h("span", { class: "tgt-stat", html: "query <b>N" + q + "</b>" + predStr }));
      info.appendChild(h("span", { class: "tgt-stat", html: "incident-edge mass <b>" + incident.toFixed(3) + "</b>" }));
      info.appendChild(h("span", { class: "tgt-stat", html: "self mass <b>" + self.toFixed(3) + "</b>" }));
      info.appendChild(h("span", { class: "tgt-hint", text: "hover a graph node to make it the query; drag to rearrange" }));
    }

    canvas.addEventListener("mousemove", function (ev) {
      if (!state.data) return;
      var r = canvas.getBoundingClientRect(), cell = canvas._cell, sc = r.width / canvas.width;
      var j = Math.floor(((ev.clientX - r.left) / sc - canvas._mL) / cell);
      var i = Math.floor(((ev.clientY - r.top) / sc - canvas._mT) / cell);
      var M = mat();
      if (i >= 0 && i < M.length && j >= 0 && j < M.length) {
        showTip(ev.clientX, ev.clientY, "q=" + tokLabel(i) + " &#8592; k=" + tokLabel(j) + " : <b>" + M[i][j].toFixed(3) + "</b>");
        var tk = state.data.tokens[j];
        state.hoverEdge = tk.type === "edge" ? { u: tk.u, v: tk.v } : null;
        if (state.hoverCol !== j) { state.hoverCol = j; drawHeatmap(canvas, M, { diverging: false, split: state.data.num_nodes, focusRow: state.query, focusCol: j, rowLabels: tokLabels(), colLabels: tokLabels(), svgOverlay: svgOverlay }); }
        if (state.view) state.view.redraw();
      }
    });
    canvas.addEventListener("mouseleave", function () { hideTip(); state.hoverEdge = null; state.hoverCol = null; if (state.data) recompute(); });
    canvas.addEventListener("click", function (ev) {
      if (!state.data) return;
      var r = canvas.getBoundingClientRect(), cell = canvas._cell, sc = r.height / canvas.height;
      var i = Math.floor(((ev.clientY - r.top) / sc - canvas._mT) / cell);
      if (i >= 0 && i < state.data.num_nodes) { state.query = i; recompute(); }
    });

    function load(task) {
      getJSON("attn_" + task + ".json").then(function (d) {
        state.data = d; state.task = task; state.query = 0;
        graphWrap.querySelectorAll(".tgt-graph").forEach(function (e) { e.remove(); });
        state.view = new GraphView({
          n: d.num_nodes, edges: d.edges, width: 320, height: 300,
          onHover: function (i) { if (i != null && i < d.num_nodes) { state.query = i; recompute(); } },
          onSelect: function (i) { if (i != null && i < d.num_nodes) { state.query = i; recompute(); } },
          nodeStyle: function (i, hov) {
            var isQ = i === state.query;
            return { r: isQ ? 10 : (hov ? 9 : 8), fill: "#d0e4ff", stroke: isQ ? "#c00" : "#2a4a80", sw: isQ ? 3 : 1.2, label: String(i), labelFill: "#1a2a4a" };
          },
          edgeStyle: function (k, u, v) {
            var w = state.edgeW[u + "-" + v] || 0;
            var hl = state.hoverEdge && state.hoverEdge.u === u && state.hoverEdge.v === v;
            var attended = w > 0.02 * state.rowMax;
            if (hl) return { stroke: C_CRIMSON, width: 4 };
            return attended ? { stroke: sequential(w, state.rowMax), width: 1.5 + 9 * (w / state.rowMax) } : { stroke: "#b0b8cc", width: 1.5 };
          }
        });
        graphWrap.appendChild(state.view.svg);
        recompute();
      });
    }
    load(state.task);
  }

  // show a tooltip while hovering a node in a live GraphView
  function attachHover(view, htmlFn) {
    view.svg.addEventListener("mousemove", function (ev) {
      var i = view.hovered();
      if (i != null) showTip(ev.clientX, ev.clientY, htmlFn(i)); else hideTip();
    });
    view.svg.addEventListener("pointerleave", hideTip);
  }

  /* =======================================================================
   * Demo 2 — Degree-direction steering (live graph, per-node predictions)
   * ===================================================================== */
  function initSteering(root) {
    var fig = figure(root, "Degree-direction steering");
    var controls = h("div", { class: "tgt-controls" });
    
    var schem = buildSchematic(null, null, null, null, false, 0);
    controls.appendChild(schem);

    var graphWrap = h("div", { class: "tgt-panel tgt-panel-wide" });
    var readout = h("div", { class: "tgt-info" });
    graphWrap.appendChild(h("div", { class: "tgt-cap", text: "each node shows its predicted degree \u00b7 blue = correct, red = wrong \u00b7 move the slider to steer" }));
    fig.appendChild(controls); fig.appendChild(graphWrap); fig.appendChild(readout);
    var state = { data: null, ai: 0, view: null };
    var slider = h("input", { type: "range", min: "0", max: "24", value: "12", step: "1", class: "tgt-range" });
    slider.addEventListener("input", function () { state.ai = +slider.value; refresh(); });

    getJSON("degree_steering.json").then(function (d) {
      state.data = d; state.ai = d.alphas.indexOf(0); if (state.ai < 0) state.ai = 0;
      slider.max = String(d.alphas.length - 1); slider.value = state.ai;
      controls.appendChild(h("label", { class: "tgt-ctl tgt-ctl-wide" }, [h("span", { text: "steering strength" }), slider]));
      state.view = new GraphView({
        n: d.num_nodes, edges: d.edges, width: 460, height: 340, radius: 9,
        onHover: function () { },
        nodeStyle: function (i, hov) {
          var row = d.rows[state.ai], pred = row.predictions[i], correct = pred === d.labels[i];
          return { r: hov ? 11 : 10, fill: correct ? "#d0e4ff" : "#f5b0b0", stroke: correct ? "#2a4a80" : "#c00", sw: 1.4, label: String(pred), labelFill: "#123" };
        },
        edgeStyle: function () { return { stroke: "#b0b8cc", width: 1.3 }; }
      });
      graphWrap.appendChild(state.view.svg);
      attachHover(state.view, function (i) {
        var row = d.rows[state.ai];
        return "node <b>N" + i + "</b><br>true degree <b>" + d.labels[i] + "</b> \u00b7 predicted <b>" + row.predictions[i] + "</b>";
      });
      refresh();
    });

    function refresh() {
      if (!state.data) return;
      var d = state.data, row = d.rows[state.ai];
      slider.value = state.ai; state.view.redraw();
      readout.innerHTML = "";
      readout.appendChild(h("span", { class: "tgt-stat", html: "\u03b1 = <b>" + d.alphas[state.ai] + "</b>" }));
      readout.appendChild(h("span", { class: "tgt-stat", html: "accuracy <b>" + (row.accuracy * 100).toFixed(0) + "%</b> (" + Math.round(row.accuracy * d.num_nodes) + "/" + d.num_nodes + ")" }));
      readout.appendChild(h("span", { class: "tgt-hint", text: "at \u03b1=0 the clean model is 100% correct; steering along the degree direction flips node predictions (precomputed)" }));
    }
  }

  /* =======================================================================
   * Demo 3 — Ring membership, layer-1 ablation (live graph, per-node preds)
   * ===================================================================== */
  function initRing(root) {
    var fig = figure(root, "Ring membership \u2014 layer-1 ablation");
    var controls = h("div", { class: "tgt-controls" });
    
    var l1cells = [];
    var schem = buildSchematic(null, l1cells, null, null, false, null);
    controls.appendChild(schem);

    var graphWrap = h("div", { class: "tgt-panel tgt-panel-wide" });
    var readout = h("div", { class: "tgt-info" });
    graphWrap.appendChild(h("div", { class: "tgt-cap", text: "border: indigo = ring, crimson = non-ring \u00b7 fill: blue = correct, red = wrong \u00b7 ablate L1 with the slider" }));
    fig.appendChild(controls); fig.appendChild(graphWrap); fig.appendChild(readout);
    var state = { data: null, si: 0, view: null };
    var slider = h("input", { type: "range", min: "0", max: "10", value: "0", step: "1", class: "tgt-range" });
    slider.addEventListener("input", function () { state.si = +slider.value; refresh(); });

    getJSON("ring_ablation.json").then(function (d) {
      state.data = d; slider.max = String(d.rows.length - 1);
      controls.appendChild(h("label", { class: "tgt-ctl tgt-ctl-wide" }, [h("span", { text: "L1 ablation strength" }), slider]));
      state.view = new GraphView({
        n: d.num_nodes, edges: d.edges, width: 460, height: 340, radius: 9,
        onHover: function () { },
        nodeStyle: function (i, hov) {
          var row = d.rows[state.si], pred = row.predictions[i], ring = d.labels[i] === 1, correct = pred === d.labels[i];
          return { r: hov ? 11 : 9, fill: correct ? "#d0e4ff" : "#f5b0b0", stroke: ring ? C_INDIGO : C_CRIMSON, sw: 2.6, label: null };
        },
        edgeStyle: function () { return { stroke: "#b0b8cc", width: 1.3 }; }
      });
      graphWrap.appendChild(state.view.svg);
      attachHover(state.view, function (i) {
        var row = d.rows[state.si];
        return "node <b>N" + i + "</b> \u00b7 " + (d.labels[i] === 1 ? "ring" : "non-ring") + "<br>predicted <b>" + (row.predictions[i] === 1 ? "ring" : "non-ring") + "</b>";
      });
      refresh();
    });

    function refresh() {
      if (!state.data) return;
      var d = state.data, row = d.rows[state.si];
      slider.value = state.si; state.view.redraw();
      
      var op = 1 - row.ablation_strength;
      l1cells.forEach(function (c) { c.style.background = "rgba(165,0,52," + (1 - op) + ")"; c.style.borderColor = op < 0.5 ? "var(--tgt-crimson)" : "#d0d0d8"; });

      readout.innerHTML = "";
      readout.appendChild(h("span", { class: "tgt-stat", html: "ablation <b>" + row.ablation_strength.toFixed(1) + "</b>" }));
      readout.appendChild(h("span", { class: "tgt-stat", html: "overall <b>" + (row.overall_accuracy * 100).toFixed(0) + "%</b>" }));
      readout.appendChild(h("span", { class: "tgt-stat", html: "<span style='color:" + C_INDIGO + "'>ring</span> <b>" + (row.ring_accuracy * 100).toFixed(0) + "%</b> \u00b7 <span style='color:" + C_CRIMSON + "'>non-ring</span> <b>" + (row.nonring_accuracy * 100).toFixed(0) + "%</b>" }));
      readout.appendChild(h("span", { class: "tgt-hint", text: "full L1 ablation leaves ring nodes intact but collapses non-ring predictions \u2014 a class-imbalanced failure" }));
    }
  }

  /* =======================================================================
   * Demo 4 — Shortest-path L2:H2 vs BFS parent (single graph)
   * ===================================================================== */
  function initSPD(root) {
    var fig = figure(root, "Shortest-path L2:H2 routing");
    var controls = h("div", { class: "tgt-controls" });
    
    var schem = buildSchematic(null, null, 2, 2, false, null);
    controls.appendChild(schem);

    var graphWrap = h("div", { class: "tgt-panel tgt-panel-wide" });
    var readout = h("div", { class: "tgt-info" });
    graphWrap.appendChild(h("div", { class: "tgt-cap", text: "arrows = L2:H2 top-1 attention \u00b7 each node points to its BFS parent toward the root (gold) \u00b7 drag to explore" }));
    fig.appendChild(controls); fig.appendChild(graphWrap); fig.appendChild(readout);
    var state = { data: null, view: null };

    getJSON("spd_bfs.json").then(function (d) {
      state.data = d;
      var rootN = +d.root_closeness;
      var mass = {};
      for (var i = 0; i < d.num_nodes; i++) { var r = d.l2h2_attention[i], mx = 0; for (var j = 0; j < r.length; j++) if (r[j] > mx) mx = r[j]; mass[i] = mx; }
      state.view = new GraphView({
        n: d.num_nodes, edges: d.edges, width: 460, height: 340, radius: 9,
        onHover: function () { },
        nodeStyle: function (i, hov) {
          var isRoot = i === rootN;
          return { r: isRoot ? 12 : (hov ? 11 : 9), fill: isRoot ? "#ffe9a8" : "#d0e4ff", stroke: isRoot ? "#b08000" : "#2a4a80", sw: isRoot ? 2.6 : 1.3, label: String(i), labelFill: "#123" };
        },
        edgeStyle: function () { return { stroke: "#b0b8cc", width: 1.3 }; }
      });
      graphWrap.appendChild(state.view.svg);
      var arrows = [];
      Object.keys(d.learned_top1).forEach(function (nk) {
        var tg = d.learned_top1[nk]; if (tg == null || +nk === +tg) return;
        var matches = !!d.node_matches[nk];
        arrows.push({ from: +nk, to: +tg, color: matches ? C_INDIGO : C_CRIMSON, width: matches ? 2 : 2.4, opacity: 0.35 + 0.6 * (mass[+nk] || 0), flow: matches });
      });
      state.view.setArrows(arrows);
      attachHover(state.view, function (i) {
        return "node <b>N" + i + "</b><br>BFS parent <b>N" + d.bfs_parent[i] + "</b> \u00b7 L2:H2 top-1 <b>N" + d.learned_top1[i] + "</b><br>top-1 mass <b>" + (mass[i] || 0).toFixed(2) + "</b>";
      });
      var matchN = Object.keys(d.node_matches).filter(function (k) { return d.node_matches[k]; }).length;
      readout.appendChild(h("span", { class: "tgt-stat", html: "L2:H2 matches BFS parent <b>" + matchN + "/" + d.num_nodes + "</b>" }));
      readout.appendChild(h("span", { class: "tgt-stat", html: "mean top-1 attention mass <b>" + d.mean_top1_mass.toFixed(2) + "</b>" }));
      readout.appendChild(h("span", { class: "tgt-hint", text: "head L2:H2 concentrates attention on each node\u2019s parent toward the closeness root, copying distance one hop at a time" }));
    });
  }

  /* =======================================================================
   * Demo 5 — QK identifier matrices (hover crosshair + tooltip)
   * ===================================================================== */
  function initQK(root) {
    var fig = figure(root, "QK identifier-matching matrices");
    var controls = h("div", { class: "tgt-controls" });
    
    var heads = [];
    var schem = buildSchematic(heads, null, null, null, false, null);
    controls.appendChild(schem);

    var panel = h("div", { class: "tgt-panel" });
    var readout = h("div", { class: "tgt-info" });
    var canvas = h("canvas", { class: "tgt-canvas" });
    panel.appendChild(h("div", { class: "tgt-cap", text: "QK score \u00b7 query identifier (row) \u00d7 key identifier (col) \u00b7 hover to inspect" }));
    panel.appendChild(canvas);
    var cbLo = h("span", { class: "tgt-legend-t", text: "–" });
    var cbMid = h("span", { class: "tgt-legend-t", text: "0" });
    var cbHi = h("span", { class: "tgt-legend-t", text: "+" });
    var cbar = h("div", { class: "tgt-cbar" }, [colorbar(true), h("div", { class: "tgt-cbar-ticks" }, [cbLo, cbMid, cbHi])]);
    panel.appendChild(cbar);
    fig.appendChild(controls); fig.appendChild(panel); fig.appendChild(readout);
    var state = { task: "spd", head: 5, channel: "vu", data: null, hover: null };

    controls.appendChild(selectCtl("task", [{ value: "degree", label: "degree" }, { value: "ring", label: "ring" }, { value: "spd", label: "shortest path" }], function (v) { load(v); }, state.task));
    controls.appendChild(selectCtl("head", [0, 1, 2, 3, 4, 5, 6, 7].map(function (l) { return { value: String(l), label: "H" + l }; }), function (v) { state.head = +v; render(); }, "5"));
    controls.appendChild(selectCtl("channel", [{ value: "uu", label: "u\u2013u" }, { value: "uv", label: "u\u2013v" }, { value: "vu", label: "v\u2013u" }, { value: "vv", label: "v\u2013v" }], function (v) { state.channel = v; render(); }, "vu"));

    function entry() { return state.data.matrices.filter(function (e) { return e.head === state.head && e.channel === state.channel; })[0]; }

    canvas.addEventListener("mousemove", function (ev) {
      var e = entry(); if (!e) return;
      var r = canvas.getBoundingClientRect(), cell = canvas._cell;
      var j = Math.floor((ev.clientX - r.left) / (r.width / canvas.width) / cell);
      var i = Math.floor((ev.clientY - r.top) / (r.height / canvas.height) / cell);
      if (e.matrix[i] && e.matrix[i][j] != null) {
        showTip(ev.clientX, ev.clientY, "q id <b>" + i + "</b> &#8592; k id <b>" + j + "</b><br>QK score <b>" + e.matrix[i][j].toFixed(4) + "</b>");
        if (!state.hover || state.hover.i !== i || state.hover.j !== j) { state.hover = { i: i, j: j }; paint(); }
      }
    });
    canvas.addEventListener("mouseleave", function () { hideTip(); state.hover = null; paint(); });

    function paint() {
      var e = entry(); if (!e) return;
      var res = drawHeatmap(canvas, e.matrix, { diverging: true, cell: 11, focusRow: state.hover ? state.hover.i : null, focusCol: state.hover ? state.hover.j : null });
      cbLo.textContent = "−" + res.vmax.toFixed(3); cbHi.textContent = "+" + res.vmax.toFixed(3);
    }
    function render() {
      var e = entry();
      readout.innerHTML = "";
      if (!e) { readout.appendChild(h("span", { class: "tgt-hint", text: "no matrix for this head/channel" })); return; }
      state.hover = null; paint();
      
      heads.forEach(function (hc) {
        if (hc.l === e.layer && hc.h === e.head) hc.el.className = "tgt-schem-h active";
        else hc.el.className = "tgt-schem-h";
      });

      readout.appendChild(h("span", { class: "tgt-stat", html: "L" + e.layer + ":H" + e.head + " \u00b7 channel <b>" + state.channel + "</b>" }));
      readout.appendChild(h("span", { class: "tgt-stat", html: "selectivity <b>" + e.selectivity.toFixed(2) + "</b>" }));
      readout.appendChild(h("span", { class: "tgt-hint", text: "a bright indigo diagonal indicates an identifier-equality (identity) test" }));
    }
    function load(task) { getJSON("qk_" + task + ".json").then(function (d) { state.data = d; state.task = task; render(); }); }
    load(state.task);
  }

  // ---- boot ---------------------------------------------------------------
  var DEMOS = { attention: initAttention, steering: initSteering, ring: initRing, spd: initSPD, qk: initQK };
  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-tgt-demo]"), function (node) {
      var kind = node.getAttribute("data-tgt-demo");
      if (DEMOS[kind]) whenVisible(node, function () { DEMOS[kind](node); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
