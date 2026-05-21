import csv
import difflib
from pathlib import Path
from typing import Optional

from app.config import NUTRITION_CSV

FUZZY_THRESHOLD = 0.60


# ─────────────────────────────
# Load nutrition database
# ─────────────────────────────
def load_nutrition_db(csv_path: Path) -> dict:
    db = {}

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:

            key = row["ingr_name"].strip().lower()

            db[key] = {
                "cal_per_g": float(row["cal/g"]),
                "fat_per_g": float(row["fat(g)"]),
                "carb_per_g": float(row["carb(g)"]),
                "protein_per_g": float(row["protein(g)"]),
            }

    return db


# ─────────────────────────────
# Load once at startup
# ─────────────────────────────
nutrition_db = load_nutrition_db(NUTRITION_CSV)

print(f"Nutrition DB loaded: {len(nutrition_db)} items")


# ─────────────────────────────
# Lookup function
# ─────────────────────────────
def lookup_nutrition(class_name: str) -> Optional[dict]:

    key = class_name.strip().lower()

    # 1. exact match
    if key in nutrition_db:
        return nutrition_db[key]

    # 2. substring match
    for db_key in nutrition_db:
        if key in db_key or db_key in key:
            return nutrition_db[db_key]

    # 3. fuzzy match
    matches = difflib.get_close_matches(
        key,
        nutrition_db.keys(),
        n=1,
        cutoff=FUZZY_THRESHOLD
    )

    if matches:
        return nutrition_db[matches[0]]

    return None