#!/usr/bin/env python3
"""
Scan photography/photos/ and regenerate data/galleries.json + optimized
web images in photography/photos-web/.

This is the ONLY thing you ever need to run after adding photos:

    python3 photography/scripts/sync_photos.py

Folder-based discovery — no code edits required to add a photo or a
whole new category:

    photography/photos/
      sports/
        football/        <- any folder here becomes a Sports category
        cross-country/
        basketball/       <- just create the folder and drop JPGs in it
      wildlife/           <- flat gallery, no subfolders

Optional per-folder "meta.json" lets you set a caption, feature a shot
on the homepage, control order, or hide a photo — but a photo with NO
entry in meta.json still shows up automatically with sensible defaults.
See photography/README.md for the full guide.

Requires Pillow (already installed on this Mac): pip3 install Pillow
"""

import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent          # .../photography
PHOTOS = ROOT / "photos"
WEB = ROOT / "photos-web"
DATA = ROOT / "data" / "galleries.json"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
FULL_MAX = 2000     # px, long edge — used in the lightbox
THUMB_MAX = 900      # px, long edge — used in grid cards
FULL_QUALITY = 82
THUMB_QUALITY = 78


def list_images(folder: Path):
    if not folder.is_dir():
        return []
    return sorted(
        p for p in folder.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS and not p.name.startswith(".")
    )


def load_meta(folder: Path) -> dict:
    meta_path = folder / "meta.json"
    if not meta_path.exists():
        return {}
    try:
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print(f"  ! Could not read {meta_path.relative_to(ROOT)}: {e}")
        return {}


def humanize(stem: str) -> str:
    return stem.replace("-", " ").replace("_", " ").strip().title()


def ensure_derivative(src: Path, dest: Path, max_dim: int, quality: int):
    """Write a resized/compressed copy of src to dest if missing or stale."""
    if dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
        with Image.open(dest) as existing:
            return existing.size
    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as img:
        img = ImageOps.exif_transpose(img)
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)
        img.save(dest, "JPEG", quality=quality, optimize=True, progressive=True)
        return img.size


def sync_gallery(folder: Path, label_default: str, id_prefix: str):
    """Build the photo list for one flat folder of images (a category or wildlife)."""
    meta = load_meta(folder)
    label = meta.get("_label", label_default)
    images = list_images(folder)

    entries = []
    for idx, path in enumerate(images):
        rel = path.relative_to(PHOTOS)  # e.g. sports/football/DSC01.jpg
        photo_meta = meta.get(path.name, {})
        if photo_meta.get("hidden"):
            continue

        web_rel = rel.with_suffix(".jpg")
        full_dest = WEB / web_rel
        thumb_dest = WEB / web_rel.parent / f"{web_rel.stem}-thumb.jpg"

        w, h = ensure_derivative(path, full_dest, FULL_MAX, FULL_QUALITY)
        ensure_derivative(path, thumb_dest, THUMB_MAX, THUMB_QUALITY)

        sort_key = (
            photo_meta["order"] if isinstance(photo_meta.get("order"), (int, float)) else 1_000_000 + idx,
            path.name,
        )
        entries.append({
            "sort_key": sort_key,
            "id": f"{id_prefix}-{idx + 1:03d}",
            "title": photo_meta.get("caption") or humanize(path.stem),
            "file": str(Path("photos-web") / web_rel).replace("\\", "/"),
            "thumb": str(Path("photos-web") / web_rel.parent / f"{web_rel.stem}-thumb.jpg").replace("\\", "/"),
            "w": w,
            "h": h,
            "featured": bool(photo_meta.get("featured")),
        })

    entries.sort(key=lambda e: e["sort_key"])
    for e in entries:
        del e["sort_key"]

    return {"label": label, "photos": entries}


def main():
    data = {"site": {}, "sports": {}, "wildlife": {"label": "Wildlife", "photos": []}}

    sports_dir = PHOTOS / "sports"
    if sports_dir.is_dir():
        for category_folder in sorted(sports_dir.iterdir()):
            if not category_folder.is_dir() or category_folder.name.startswith("."):
                continue
            slug = category_folder.name
            gallery = sync_gallery(category_folder, humanize(slug), slug)
            if gallery["photos"]:
                data["sports"][slug] = gallery

    wildlife_dir = PHOTOS / "wildlife"
    data["wildlife"] = sync_gallery(wildlife_dir, "Wildlife", "wildlife")

    # Hero: explicit photos/site-meta.json override, else the first featured
    # football photo, else the first photo in the first sports category.
    site_meta = load_meta(PHOTOS)
    hero_override = site_meta.get("hero")
    hero = None
    if hero_override and (PHOTOS / hero_override).exists():
        rel = Path(hero_override)
        hero = str(Path("photos-web") / rel.with_suffix(".jpg")).replace("\\", "/")
        ensure_derivative(PHOTOS / rel, WEB / rel.with_suffix(".jpg"), FULL_MAX, FULL_QUALITY)
    else:
        for slug, gallery in data["sports"].items():
            for p in gallery["photos"]:
                if p["featured"]:
                    hero = p["file"]
                    break
            if hero:
                break
        if not hero:
            for gallery in data["sports"].values():
                if gallery["photos"]:
                    hero = gallery["photos"][0]["file"]
                    break
    data["site"]["hero"] = hero

    DATA.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")

    sport_counts = ", ".join(f"{v['label']}: {len(v['photos'])}" for v in data["sports"].values()) or "none"
    print(f"Wrote {DATA.relative_to(ROOT.parent)}")
    print(f"  Sports — {sport_counts}")
    print(f"  Wildlife — {len(data['wildlife']['photos'])}")
    print(f"  Hero — {hero or '(none — add a featured sports photo)'}")


if __name__ == "__main__":
    main()
