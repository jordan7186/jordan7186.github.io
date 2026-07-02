#!/usr/bin/env python3
"""Trim demo_package_2 static results into lightweight web assets.

Reads the revised, model-backed static results and writes small, rounded JSON
files into ``assets/json/tgt-demos/`` for the interactive blog post
"Discovering Mechanisms in Tokenized Graph Transformers".

Offline, one-time build step. Generated JSON is committed; the demo package is
not required at deploy time. No PyTorch / checkpoints / datasets are touched.

Usage:
    python bin/build_tgt_demos.py [--src ../demo_package_2/static_results]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

TASKS = ["degree", "ring", "spd"]


def rnd(obj, nd):
    if isinstance(obj, float):
        return round(obj, nd)
    if isinstance(obj, list):
        return [rnd(x, nd) for x in obj]
    if isinstance(obj, dict):
        return {k: rnd(v, nd) for k, v in obj.items()}
    return obj


def load(src: Path, name: str):
    with open(src / name) as f:
        return json.load(f)


def dump(out: Path, name: str, data) -> None:
    path = out / name
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    print(f"  wrote {name} ({path.stat().st_size / 1024:.1f} KB)")


def build_attention(src: Path, out: Path) -> None:
    d = load(src, "attention_identifier/connected_attention_identifier_examples.json")
    for task in TASKS:
        t = d["tasks"][task]
        g = t["graph"]
        attn = {}
        for li in range(4):
            attn[str(li)] = rnd(t["attention"][f"encoder.{li}.attn_pattern"], 4)
        preds = t["predictions"]
        if isinstance(preds, dict):  # spd pairwise_class
            predictions = {"type": preds.get("type", "pairwise_class"),
                           "labels": g["labels"], "predictions": preds["predictions"]}
        else:  # degree / ring: per-node list
            predictions = {"type": "node", "labels": g["labels"], "predictions": preds}
        payload = {
            "task": task,
            "num_nodes": g["num_nodes"],
            "num_edges": g["num_edges"],
            "num_tokens": g["num_tokens"],
            "layers": [0, 1, 2, 3],
            "heads": 8,
            "tokens": g["tokens"],
            "edges": g["edges"],
            "predictions": predictions,
            "attention": attn,
        }
        dump(out, f"attn_{task}.json", payload)


def build_degree_steering(src: Path, out: Path) -> None:
    d = load(src, "degree_steering/degree_steering_single_graph.json")
    g = d["graph"]
    rows = [{"alpha": r["alpha"], "accuracy": round(r["accuracy"], 4),
             "predictions": r["predictions"], "changed_from_clean": r["changed_from_clean"]}
            for r in d["alpha_rows"]]
    payload = {
        "num_nodes": g["num_nodes"], "num_edges": g["num_edges"], "num_tokens": g["num_tokens"],
        "tokens": g["tokens"], "edges": g["edges"], "labels": g["labels"],
        "alphas": [r["alpha"] for r in d["alpha_rows"]],
        "rows": rows,
    }
    dump(out, "degree_steering.json", payload)


def build_ring_ablation(src: Path, out: Path) -> None:
    d = load(src, "ring_l1_ablation/ring_l1_ablation_single_graph.json")
    g = d["graph"]
    rows = [{"ablation_strength": round(r["ablation_strength"], 3),
             "predictions": r["predictions"],
             "overall_accuracy": round(r["overall_accuracy"], 4),
             "ring_accuracy": round(r["ring_accuracy"], 4),
             "nonring_accuracy": round(r["nonring_accuracy"], 4)}
            for r in d["ablation_rows"]]
    payload = {
        "num_nodes": g["num_nodes"], "num_edges": g["num_edges"], "num_tokens": g["num_tokens"],
        "tokens": g["tokens"], "edges": g["edges"], "labels": g["labels"],
        "rows": rows,
    }
    dump(out, "ring_ablation.json", payload)


def build_spd(src: Path, out: Path) -> None:
    d = load(src, "spd_l2h2/spd_l2h2_bfs_parent_example.json")
    g = d["graph"]
    payload = {
        "num_nodes": g["num_nodes"], "num_edges": g["num_edges"],
        "edges": g["edges"], "tokens": g["tokens"],
        "bfs_parent": d["bfs_parent"], "learned_top1": d["learned_top1"],
        "node_matches": d["node_matches"],
        "l2h2_attention": rnd(d["l2h2_node_to_node_attention"], 4),
        "match_rate": round(d["match_rate"], 4),
        "mean_top1_mass": round(d["mean_top1_mass"], 4),
        "root_closeness": d["root_closeness"],
    }
    dump(out, "spd_bfs.json", payload)


def build_qk(src: Path, out: Path) -> None:
    raw = load(src, "qk_matrix/qk_identifier_raw_matrices.json")
    active = raw.get("active_identifier_count")
    for task in TASKS:
        mats = []
        for e in raw["tasks"][task]["matrices"]:
            mats.append({"layer": e["layer"], "head": e["head"], "channel": e["channel"],
                         "selectivity": round(float(e["selectivity"]), 4), "matrix": rnd(e["matrix"], 5)})
        dump(out, f"qk_{task}.json", {"task": task, "active": active, "matrices": mats})


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--src", default="../demo_package_2/static_results",
                        help="Path to demo_package_2/static_results (default: %(default)s)")
    parser.add_argument("--out", default="assets/json/tgt-demos",
                        help="Output directory (default: %(default)s)")
    args = parser.parse_args()

    src = Path(args.src).resolve()
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    print(f"src: {src}\nout: {out}")

    build_attention(src, out)
    build_degree_steering(src, out)
    build_ring_ablation(src, out)
    build_spd(src, out)
    build_qk(src, out)
    print("done.")


if __name__ == "__main__":
    main()
