"""
Evaluate Gemma 4 on the ETID held-out split.
Usage (from backend/):
  python scripts/evaluate_etid.py --data data/etid_eval --out etid_results.json
Each sub-folder name is the ground-truth class.
"""
import argparse
import asyncio
import json
from collections import Counter, defaultdict
from pathlib import Path

from app.config import dataset_labels, get_settings
from app.gemma_client import run_gemma_vision
from app.prompts import SCAN_SYSTEM_PROMPT, build_user_prompt, extract_json

MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}


def norm(s) -> str:
    return (s or "").strip().lower()


async def evaluate(root: Path) -> dict:
    cfg = dataset_labels()
    hints = cfg["label_hints"]
    truth_to_category = {norm(k): v["category"] for k, v in cfg["mappings"].items()}

    rows, parse_fail = [], 0
    confusion: dict[str, Counter] = defaultdict(Counter)

    for class_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        truth = class_dir.name
        for img in sorted(class_dir.iterdir()):
            if img.name.startswith("._") or img.suffix.lower() not in MIME:
                continue
            raw, _ = await run_gemma_vision(
                SCAN_SYSTEM_PROMPT, build_user_prompt(hints),
                img.read_bytes(), MIME[img.suffix.lower()],
            )
            try:
                parsed = extract_json(raw)
            except Exception:
                parse_fail += 1
                parsed = {}

            pred_label = parsed.get("dataset_label")
            pred_category = parsed.get("category")
            label_hit = norm(pred_label) == norm(truth)
            category_hit = pred_category == truth_to_category.get(norm(truth))

            confusion[truth][pred_label or "none"] += 1
            rows.append({
                "file": str(img), "truth": truth, "pred": pred_label,
                "label_correct": label_hit, "category_correct": category_hit,
            })

    total = len(rows)
    per_class = {}
    for cls in sorted({r["truth"] for r in rows}):
        cls_rows = [r for r in rows if r["truth"] == cls]
        per_class[cls] = round(sum(r["label_correct"] for r in cls_rows) / len(cls_rows), 4)

    summary = {
        "model": get_settings().ollama_model if get_settings().gemma_provider == "ollama"
                 else get_settings().gemma_api_model,
        "provider": get_settings().gemma_provider,
        "total": total,
        "label_accuracy": round(sum(r["label_correct"] for r in rows) / total, 4) if total else 0.0,
        "category_accuracy": round(sum(r["category_correct"] for r in rows) / total, 4) if total else 0.0,
        "json_parse_failures": parse_fail,
        "per_class_label_accuracy": per_class,
    }
    return {
        "summary": summary,
        "confusion": {k: dict(v) for k, v in confusion.items()},
        "rows": rows,
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="data/etid_eval")
    ap.add_argument("--out", default="etid_results.json")
    args = ap.parse_args()
    result = asyncio.run(evaluate(Path(args.data)))
    Path(args.out).write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result["summary"], indent=2))