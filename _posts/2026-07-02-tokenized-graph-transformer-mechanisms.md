---
layout: post
title: Discovering Mechanisms in Tokenized Graph Transformers (Interactive Demo)
description: Presented in ICML worhkshop on Mechanistic Interpretability 2026.
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
.tgt { --tgt-crimson:#a50034; --tgt-indigo:#2d2e83; --tgt-ink:#1a1a1a; --tgt-muted:#6b6b6b; --tgt-line:#e4e4e7; width:100%; max-width:760px; margin-left:auto; margin-right:auto; }
.tgt-fig { background:#fff; color:var(--tgt-ink); border:1px solid var(--tgt-line); border-radius:10px; padding:16px 18px 14px; margin:1.2rem 0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
.tgt-fig-title { font-weight:600; font-size:.82rem; letter-spacing:.04em; text-transform:uppercase; color:var(--tgt-muted); margin-bottom:12px; }
.tgt-controls { display:flex; flex-wrap:wrap; gap:14px; align-items:center; margin-bottom:14px; }
.tgt-ctl { display:flex; flex-direction:column; gap:4px; font-size:.72rem; color:var(--tgt-muted); text-transform:uppercase; letter-spacing:.03em; }
.tgt-ctl-wide { flex:1; min-width:220px; }
.tgt-math-label, .tgt-math-label mjx-container { text-transform:none; letter-spacing:0; }
.tgt-select { font-size:.85rem; padding:5px 8px; border:1px solid var(--tgt-line); border-radius:6px; background:#fbfbfb; color:var(--tgt-ink); }
.tgt-range { width:100%; accent-color:var(--tgt-indigo); }
.tgt-stage { display:flex; flex-wrap:wrap; gap:18px; align-items:flex-start; }
.tgt-panel { flex:1; min-width:280px; overflow-x:auto; }
.tgt-demo-wide { width:100%; max-width:1040px; margin-left:auto; margin-right:auto; min-width:0; }
.tgt-demo-wide .tgt-fig { overflow-x:auto; }
.tgt-demo-wide .tgt-stage { flex-wrap:nowrap; }
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
.tgt-schem { display:flex; flex-direction:column; gap:0; margin-right:16px; padding-right:16px; border-right:1px solid var(--tgt-line); line-height:0; }
.tgt-schem-l { display:flex; gap:2px; align-items:center; height:12px; margin:0; }
.tgt-schem-l + .tgt-schem-l { margin-top:-1px; }
.tgt-schem-h { display:block; box-sizing:border-box; width:12px; height:12px; margin:0; background:#ececf3; border:1px solid #d0d0d8; border-radius:2px; transition:background .3s; }
.tgt-schem-h.active { background:var(--tgt-indigo); border-color:var(--tgt-indigo); box-shadow:0 0 4px var(--tgt-indigo); }
.tgt-schem-h.active-res { background:var(--tgt-crimson); border-color:var(--tgt-crimson); box-shadow:0 0 4px var(--tgt-crimson); }
.tgt-schem-lab { font-size:8px; color:var(--tgt-muted); text-align:center; margin-top:2px; font-family:ui-monospace,monospace; }
.tgt-schem-l-lab { font-size:8px; line-height:12px; color:var(--tgt-muted); width:12px; text-align:right; margin-right:2px; font-family:ui-monospace,monospace; }
.tgt-schem-h-labs { display:flex; align-items:flex-end; gap:2px; height:8px; margin:0 0 0 16px; line-height:8px; }
.tgt-schem-h-lab { width:12px; height:8px; font-size:8px; line-height:8px; color:var(--tgt-muted); text-align:center; font-family:ui-monospace,monospace; }
@media (max-width: 767px) { .tgt-demo-wide { grid-column:text; } .tgt-demo-wide .tgt-stage { flex-wrap:wrap; } }
</style>

## Overview

Paper: [Discovering Mechanisms in Tokenized Graph Transformers](https://openreview.net/forum?id=0WEuCiokZq) (ICML 2026 Workshop on Mechanistic Interpretability)

Although the field of mechanistic interpretability has made significant progress in large language models (particularly natural language reasoning), the techinques have yet to be applied to a more general class of data structures, such as graphs. In our recent paper **"Discovering Mechanisms in Tokenized Graph Transformers"**, we use various mechanistic interpretability techniques to analyze the inner workings of a **graph transformer** trained on a synthetic graph dataset with [TokenGT](https://arxiv.org/abs/2207.02505)-like tokenization. By nature, graphs provide rich and complex relational structures, and therefore we expected that the model would have learned to identify nodes and compose them in task-specific ways. By training the model to solve three tasks (*i.e.*, **degree counting, ring membership, and shortest path distance**), we identify several key mechanisms that the model uses to solve the task, including early degree-like computation, task-specific compositions, and node ID identification.

In this post, we present a series of interactive demos that provides a visual and intuitive understanding of several key points from the paper, as well as some additional insights that were not included in the paper.

### Setup at a glance
The figure below shows how the graph is represented, and how the model is trained to solve the three tasks. 

<div style="max-width: 480px; margin: 0 auto;">
  <img
    src="{{ '/assets/img/blog7_Figure1.jpg' | relative_url }}"
    class="img-fluid rounded z-depth-1"
    alt=""
  >
</div>

## Degree direction steering
One of the most prominent mechanisms that we discovered is the existance of degree direction $\hat{w}_{\mathrm{deg}}^{(0)}$ at the residual stream in the early layers of the model. Counting the degree (i.e., the number of neighbors) of a node is a fundamental structural feature while being one of the simplest information to extract from a graph. 

Naturally, encoding the degree information in the early layers of the model naturally solves the degree counting problem. In this demo, we perform an intervention experiment where we explicitly add $\alpha \hat{w}_{\mathrm{deg}}^{(0)}$ to the residual stream at the L0-mid position for the degree counting model. 

<div data-tgt-demo="steering" style="min-height:360px"></div>

If you play with the slider, you will see that the model's predictions are steered along the degree direction. In particular, when you push $\alpha$ to a higher value, the model will start to predict higher (and wrong) degrees, and vice versa for lower values of $\alpha$. This shows that the model's predictions are indeed sensitive to the degree direction, and that the model has learned to encode degree information in the early layers.

## Ring membership L1 ablation

For the ring membership task, we found that the model assumes all nodes to be a ring member by default. In this demo, we will perform a zero ablation of the entire L1.

<div data-tgt-demo="ring" style="min-height:360px"></div>

You can see that when we ablate L1, the model starts to produce incorrect predictions. Notice that all of the wrong predictions are for the non-ring nodes, which indicates that the model initially assumes all nodes to be a ring member, and that the L1 provides non-ring evidence to correct the model's predictions.

## Shortest-path routing
This demo shows the L2:H2's routing behavior for the shortest path distance task for a specific graph example. Although not always the case, we found that this head often acts as a BFS-parent pointer head, and is responsible for selectively copying the BFS-parent node's information to the current node. This is a crucial step in the model's computation, as it allows the model to understand the pairwise relationships between nodes in the graph, and to compute the shortest path distance between them.

<div data-tgt-demo="spd" style="min-height:360px"></div>

## QK identifier matrices

_Placeholder._ Query–key weights implement identifier-equality tests.

<div data-tgt-demo="qk" style="min-height:360px"></div>

<script src="{{ '/assets/js/tgt-demos.js' | relative_url }}"></script>


## Attention & identifier matching
This is a straightforward visualization of the attention maps for the trained models. The attention maps below definitely show that there exists an intricate structure in the model, which routes node and edge information in a task-specific manner. This structure was one of the primary motivations for us to investigate the model's inner workings in a mechanistic way.

<div class="tgt-demo-wide" data-tgt-demo="attention" style="min-height:360px"></div>

However, after we wrote the majority of the paper, we realized that most of the seemingly promising attention patterns were actually **not** causally active in the model's inference. This suggests that using attention maps to interpret graph transformers requires caution and requires causal validation. We included a detailed discussion on this topic in the appendix of the paper.
