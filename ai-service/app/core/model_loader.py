from ultralytics import YOLO
from app.config import MODEL_PATH

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model weights not found at {MODEL_PATH}")

print(f"Loading model from {MODEL_PATH} ...")
model = YOLO(str(MODEL_PATH))
print("Model loaded.")