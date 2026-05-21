from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
import httpx

from app.models.schemas import AnalysisResult
from app.services.inference_service import run_inference
from app.utils.image_utils import read_image

router = APIRouter()

class ImageUrlPayload(BaseModel):
    imageUrl: str

@router.get("/health")
def health():
    return {
        "status": "ok",
        "service": "KhabirLens AI Service",
    }

# ── OLD endpoint (keep for direct uploads / backward compat) ────────────────
@router.post("/predict", response_model=AnalysisResult)
async def analyze(file: UploadFile = File(...)):
    if file.content_type not in (
        "image/jpeg",
        "image/png",
        "image/webp",
    ):
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type",
        )

    contents = await file.read()
    img_np, img_h, img_w = read_image(contents)
    items = run_inference(img_np, img_h, img_w)

    total_calories = round(sum(i.calories for i in items), 1)
    total_fat_g = round(sum(i.fat_g for i in items), 2)
    total_carb_g = round(sum(i.carb_g for i in items), 2)
    total_protein_g = round(sum(i.protein_g for i in items), 2)

    return AnalysisResult(
        items=items,
        total_calories=total_calories,
        total_fat_g=total_fat_g,
        total_carb_g=total_carb_g,
        total_protein_g=total_protein_g,
        image_width=img_w,
        image_height=img_h,
    )

# ── NEW endpoint (backend sends URL, AI downloads it) ───────────────────────
@router.post("/predict/url", response_model=AnalysisResult)
async def analyze_url(payload: ImageUrlPayload):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(payload.imageUrl)
            response.raise_for_status()
            contents = response.content
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to download image from URL: {str(e)}",
        )

    img_np, img_h, img_w = read_image(contents)
    items = run_inference(img_np, img_h, img_w)

    total_calories = round(sum(i.calories for i in items), 1)
    total_fat_g = round(sum(i.fat_g for i in items), 2)
    total_carb_g = round(sum(i.carb_g for i in items), 2)
    total_protein_g = round(sum(i.protein_g for i in items), 2)

    return AnalysisResult(
        items=items,
        total_calories=total_calories,
        total_fat_g=total_fat_g,
        total_carb_g=total_carb_g,
        total_protein_g=total_protein_g,
        image_width=img_w,
        image_height=img_h,
    )