from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "final_best.pt"
NUTRITION_CSV = BASE_DIR / "nutrition.csv"

CONF_THRESHOLD = 0.30
FUZZY_THRESHOLD = 0.60
DEFAULT_GRAMS = 100