---
layout: distill
title: Discovering Mechanisms in Tokenized Graph Transformers
description: Interactive demos accompanying the paper. (Draft — narrative text to follow.)
tags: Graph_learning Interpretability
categories: Mechanistic-Interpretability
date: 2026-07-02
featured: true
giscus_comments: true
authors:
  - name: Yong-Min Shin
    url: "https://jordan7186.github.io"
toc:
  - name: Overview
  - name: Attention & identifier matching
  - name: Degree-direction steering
  - name: Ring membership L1 ablation
  - name: Shortest-path routing
  - name: QK identifier matrices
---

<style>
.tgt { --tgt-crimson:#a50034; --tgt-indigo:#2d2e83; --tgt-ink:#1a1a1a; --tgt-muted:#6b6b6b; --tgt-line:#e4e4e7; }
.tgt-fig { background:#fff; color:var(--tgt-ink); border:1px solid var(--tgt-line); border-radius:10px; padding:16px 18px 14px; margin:1.2rem 0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
.tgt-fig-title { font-weight:600; font-size:.82rem; letter-spacing:.04em; text-transform:uppercase; color:var(--tgt-muted); margin-bottom:12px; }
.tgt-controls { display:flex; flex-wrap:wrap; gap:14px; align-items:center; margin-bottom:14px; }
.tgt-ctl { display:flex; flex-direction:column; gap:4px; font-size:.72rem; color:var(--tgt-muted); text-transform:uppercase; letter-spacing:.03em; }
.tgt-ctl-wide { flex:1; min-width:220px; }
.tgt-select { font-size:.85rem; padding:5px 8px; border:1px solid var(--tgt-line); border-radius:6px; background:#fbfbfb; color:var(--tgt-ink); }
.tgt-range { width:100%; accent-color:var(--tgt-indigo); }
.tgt-stage { display:flex; flex-wrap:wrap; gap:18px; align-items:flex-start; }
.tgt-panel { flex:1; min-width:280px; overflow-x:auto; }
.tgt-cap { font-size:.74rem; color:var(--tgt-muted); margin-bottom:6px; }
.tgt-canvas { border:1px solid var(--tgt-line); image-rendering:pixelated; }
.tgt-heat-inner { position:relative; display:inline-block; }
.tgt-heat-svg { position:absolute; top:0; left:0; pointer-events:none; overflow:visible; }
.tgt-heat-lab { font-size:9px; font-family:ui-monospace,Menlo,monospace; }
.tgt-heat-lab.node { fill:#2a64d0; }
.tgt-heat-lab.edge { fill:#d07020; }
.tgt-heat-lab.foc { fill:#c00; font-weight:bold; }
.tgt-graph { width:100%; max-width:460px; height:auto; border:1px solid var(--tgt-line); border-radius:6px; background:#fff; }
.tgt-info { display:flex; flex-wrap:wrap; gap:8px 16px; align-items:center; margin-top:14px; padding-top:12px; border-top:1px dashed var(--tgt-line); }
.tgt-stat { font-size:.82rem; color:var(--tgt-ink); font-variant-numeric:tabular-nums; }
.tgt-stat b { color:var(--tgt-indigo); font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
.tgt-hint { font-size:.72rem; color:var(--tgt-muted); font-style:italic; }
.tgt-panel-wide { flex-basis:100%; }
.tgt-node-lab { font-size:9px; font-weight:bold; fill:#1a2a4a; font-family:ui-monospace,monospace; pointer-events:none; }
.tgt-node-lab.light { fill:#fff; }
.tgt-colorbar { border:1px solid var(--tgt-line); vertical-align:middle; display:block; }
.tgt-cbar { display:inline-block; margin-top:8px; }
.tgt-cbar-ticks { display:flex; justify-content:space-between; width:140px; margin-top:2px; }
.tgt-legend-t { font-size:9px; fill:var(--tgt-muted); color:var(--tgt-muted); font-family:ui-monospace,monospace; }
/* live graphs */
.tgt-graph-live { touch-action:none; cursor:default; }
.tgt-edge { stroke:#b0b8cc; }
.tgt-arrow { fill:none; }
.tgt-arrow.tgt-flow { stroke-dasharray:5 4; animation:tgt-dash 1s linear infinite; }
@keyframes tgt-dash { to { stroke-dashoffset:-18; } }
.tgt-node, .tgt-node-hit { cursor:grab; }
/* gauges */
.tgt-gauges { display:flex; flex-wrap:wrap; gap:26px; align-items:center; }
.tgt-gauge { position:relative; width:150px; text-align:center; }
.tgt-gauge-svg { width:120px; height:120px; }
.tgt-gauge-fg { transition:stroke-dashoffset .5s cubic-bezier(.4,0,.2,1); }
.tgt-gauge-val { position:absolute; top:44px; left:0; width:120px; font-size:1.3rem; font-weight:600; color:var(--tgt-ink); font-variant-numeric:tabular-nums; }
.tgt-gauge-lab { font-size:.72rem; color:var(--tgt-muted); text-transform:uppercase; letter-spacing:.04em; margin-top:2px; }
.tgt-gauge-aux { min-width:200px; }
.tgt-track { position:relative; height:34px; margin-top:10px; }
.tgt-track-line { position:absolute; top:9px; left:0; right:0; height:3px; background:#ececf3; border-radius:2px; }
.tgt-track-dot { position:absolute; top:2px; width:16px; height:16px; margin-left:-8px; border-radius:50%; background:var(--tgt-indigo); border:2px solid #fff; box-shadow:0 1px 3px rgba(0,0,0,.25); transition:left .45s cubic-bezier(.4,0,.2,1); }
.tgt-track-labels { position:absolute; top:20px; left:0; right:0; display:flex; justify-content:space-between; font-size:.7rem; color:var(--tgt-muted); font-family:ui-monospace,monospace; }
.tgt-pillrow { display:flex; gap:12px; margin-top:10px; }
.tgt-pill { text-align:center; }
.tgt-pill-dot { width:26px; height:26px; border-radius:50%; border:1px solid var(--tgt-line); transition:background .45s ease; }
.tgt-pill-lab { display:block; font-size:.68rem; color:var(--tgt-muted); font-family:ui-monospace,monospace; margin-top:3px; }
/* tooltip */
.tgt-tip { position:fixed; z-index:1000; pointer-events:none; background:rgba(20,22,45,.94); color:#fff; font-size:.72rem; line-height:1.35; padding:5px 8px; border-radius:5px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; box-shadow:0 2px 8px rgba(0,0,0,.25); display:none; }
/* schematic */
.tgt-schem { display:flex; flex-direction:column; gap:0; margin-right:16px; padding-right:16px; border-right:1px solid var(--tgt-line); }
.tgt-schem-l { display:flex; gap:2px; align-items:center; }
.tgt-schem-h { width:12px; height:12px; background:#ececf3; border:1px solid #d0d0d8; border-radius:2px; transition:background .3s; }
.tgt-schem-h.active { background:var(--tgt-indigo); border-color:var(--tgt-indigo); box-shadow:0 0 4px var(--tgt-indigo); }
.tgt-schem-h.active-res { background:var(--tgt-crimson); border-color:var(--tgt-crimson); box-shadow:0 0 4px var(--tgt-crimson); }
.tgt-schem-lab { font-size:8px; color:var(--tgt-muted); text-align:center; margin-top:2px; font-family:ui-monospace,monospace; }
.tgt-schem-l-lab { font-size:8px; color:var(--tgt-muted); width:12px; text-align:right; margin-right:2px; font-family:ui-monospace,monospace; }
.tgt-schem-h-labs { display:flex; gap:2px; margin-left:16px; }
.tgt-schem-h-lab { width:12px; font-size:8px; color:var(--tgt-muted); text-align:center; font-family:ui-monospace,monospace; }
</style>

## Overview

_Placeholder._ This post collects five interactive figures that probe the mechanisms our tokenized graph transformers learn on degree counting, ring membership, and shortest-path distance. Full narrative to be written.

All figures are interactive and run entirely in the browser from pre-exported, model-backed results, with no backend.

## Attention & identifier matching

_Placeholder._ Early attention retrieves incident edge tokens by matching node-identifier channels.

<div data-tgt-demo="attention" style="min-height:360px"></div>

## Degree-direction steering

_Placeholder._ On a graph the clean model labels perfectly, steering along the learned degree direction flips individual node predictions as the strength increases.

<div data-tgt-demo="steering" style="min-height:360px"></div>

## Ring membership L1 ablation

_Placeholder._ Ablating layer-1 attention output leaves ring-node predictions intact but collapses non-ring predictions — a class-imbalanced failure.

<div data-tgt-demo="ring" style="min-height:360px"></div>

## Shortest-path routing

_Placeholder._ Head L2:H2 concentrates on each node’s BFS parent toward the root, copying distance one hop at a time.

<div data-tgt-demo="spd" style="min-height:360px"></div>

## QK identifier matrices

_Placeholder._ Query–key weights implement identifier-equality tests.

<div data-tgt-demo="qk" style="min-height:360px"></div>

<script src="{{ '/assets/js/tgt-demos.js' | relative_url }}"></script>
