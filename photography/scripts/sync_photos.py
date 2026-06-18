#!/usr/bin/env python3
"""
Scan photography/images/ and update data/galleries.json from folder contents.

Usage (from repo root or photography/):
  python3 photography/scripts/sync_photos.py

Workflow:
  1. Drop JPGs into images/automotive/, images/astronomy/, etc.
  2. For a car meet: images/car-meets/greenville-march-2024/01.jpg, 02.jpg, cover.jpg
  3. For someone's car: images/clients/mike-gt350/01.jpg, cover.jpg
  4. Run this script — then edit titles/passwords in galleries.json if you want.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"
DATA = ROOT / "data" / "galleries.json"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def load_json():
    if DATA.exists():
        with open(DATA, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_json(data):
    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def list_images(folder: Path):
    if not folder.is_dir():
        return []
    return sorted(
        p for p in folder.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS
    )


def rel_path(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def human_title(stem: str) -> str:
    return stem.replace("-", " ").replace("_", " ").title()


def sync_portfolio_category(data, category: str, tag: str):
    folder = IMAGES / category
    portfolio = data.setdefault("portfolio", {})
    existing = {p["file"]: p for p in portfolio.get(category, [])}
    photos = []
    for i, path in enumerate(list_images(folder), 1):
        file_rel = rel_path(path)
        if file_rel in existing:
            photo = dict(existing[file_rel])
            photo["file"] = file_rel
            photo.setdefault("thumb", file_rel)
        else:
            photo = {
                "id": f"{category[:4]}-{i:03d}",
                "title": human_title(path.stem),
                "file": file_rel,
                "thumb": file_rel,
                "tags": [tag],
                "camera": "Nikon D7100",
            }
        photos.append(photo)
    portfolio[category] = photos


def sync_car_meets(data):
    meets_dir = IMAGES / "car-meets"
    existing_meets = {m["id"]: m for m in data.get("carMeets", [])}
    meets = []
    if meets_dir.is_dir():
        for meet_folder in sorted(meets_dir.iterdir()):
            if not meet_folder.is_dir():
                continue
            meet_id = f"meet-{meet_folder.name}"
            images = list_images(meet_folder)
            cover_candidates = [p for p in images if p.stem.lower() == "cover"]
            photo_files = [p for p in images if p.stem.lower() != "cover"]
            if not photo_files:
                continue
            cover = cover_candidates[0] if cover_candidates else photo_files[0]
            existing = existing_meets.get(meet_id, {})
            existing_photos = {p["file"]: p for p in existing.get("photos", [])}
            photos = []
            for i, path in enumerate(photo_files, 1):
                file_rel = rel_path(path)
                if file_rel in existing_photos:
                    p = dict(existing_photos[file_rel])
                    p["file"] = file_rel
                else:
                    p = {
                        "id": f"{meet_id}-{i:03d}",
                        "title": human_title(path.stem),
                        "file": file_rel,
                    }
                photos.append(p)
            meets.append({
                "id": meet_id,
                "name": existing.get("name", human_title(meet_folder.name)),
                "date": existing.get("date", ""),
                "location": existing.get("location", ""),
                "description": existing.get("description", ""),
                "coverImage": rel_path(cover),
                "tag": existing.get("tag", "Monthly"),
                "photos": photos,
            })
    data["carMeets"] = meets


def sync_clients(data):
    clients_dir = IMAGES / "clients"
    existing_clients = {c["id"]: c for c in data.get("clients", [])}
    clients = []
    if clients_dir.is_dir():
        for client_folder in sorted(clients_dir.iterdir()):
            if not client_folder.is_dir():
                continue
            client_id = client_folder.name
            images = list_images(client_folder)
            cover_candidates = [p for p in images if p.stem.lower() == "cover"]
            photo_files = [p for p in images if p.stem.lower() != "cover"]
            if not photo_files:
                continue
            cover = cover_candidates[0] if cover_candidates else photo_files[0]
            existing = existing_clients.get(client_id, {})
            existing_photos = {p["file"]: p for p in existing.get("photos", [])}
            photos = []
            for i, path in enumerate(photo_files, 1):
                file_rel = rel_path(path)
                if file_rel in existing_photos:
                    p = dict(existing_photos[file_rel])
                    p["file"] = file_rel
                else:
                    p = {
                        "id": f"{client_id}-{i:03d}",
                        "title": human_title(path.stem),
                        "file": file_rel,
                    }
                photos.append(p)
            clients.append({
                "id": client_id,
                "name": existing.get("name", human_title(client_folder.name)),
                "password": existing.get("password", "changeme"),
                "coverImage": rel_path(cover),
                "description": existing.get("description", ""),
                "expires": existing.get("expires"),
                "photos": photos,
            })
    data["clients"] = clients


def sync_site_paths(data):
    site = data.setdefault("site", {})
    hero = IMAGES / "hero.jpg"
    if hero.exists():
        site["hero"] = "images/hero.jpg"
    portrait = IMAGES / "about" / "portrait.jpg"
    if portrait.exists():
        site["portrait"] = "images/about/portrait.jpg"


def main():
    data = load_json()
    sync_portfolio_category(data, "automotive", "automotive")
    sync_portfolio_category(data, "astronomy", "astronomy")
    sync_car_meets(data)
    sync_clients(data)
    sync_site_paths(data)
    save_json(data)
    auto = len(data.get("portfolio", {}).get("automotive", []))
    astro = len(data.get("portfolio", {}).get("astronomy", []))
    meets = len(data.get("carMeets", []))
    clients = len(data.get("clients", []))
    print(
        f"Updated {DATA.relative_to(ROOT.parent)} — "
        f"{auto} automotive, {astro} astronomy, {meets} meets, {clients} car galleries"
    )


if __name__ == "__main__":
    main()
