"""
Build a reproducible held-out evaluation split from the raw ETID folder.
Copies a random sample of N images per class into data/etid_eval/.
Skips macOS metadata (__MACOSX, .DS_Store, ._* files).

Usage (from backend/):
  python scripts/make_eval_split.py \
    --source "/path/to/E-Tadweer Image Dataset (ETID)" \
    --dest data/etid_eval --per-class 40 --seed 42
"""
import argparse
import random
import shutil
from pathlib import Path

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}


def is_image(p: Path) -> bool:
    return p.is_file() and p.suffix.lower() in IMAGE_EXT and not p.name.startswith("._")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True)
    ap.add_argument("--dest", default="data/etid_eval")
    ap.add_argument("--per-class", type=int, default=40)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    src, dst = Path(args.source), Path(args.dest)
    rng = random.Random(args.seed)

    for class_dir in sorted(p for p in src.iterdir() if p.is_dir() and not p.name.startswith("__")):
        imgs = sorted(p for p in class_dir.iterdir() if is_image(p))
        chosen = rng.sample(imgs, min(args.per_class, len(imgs)))
        out = dst / class_dir.name
        out.mkdir(parents=True, exist_ok=True)
        for img in chosen:
            shutil.copy2(img, out / img.name)
        print(f"{class_dir.name}: copied {len(chosen)} of {len(imgs)}")


if __name__ == "__main__":
    main()