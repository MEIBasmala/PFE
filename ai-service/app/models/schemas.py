from pydantic import BaseModel


class FoodItem(BaseModel):
    class_name: str
    confidence: float
    bbox: list[float]
    mask_area_px: float
    portion_g: float
    calories: float
    fat_g: float
    carb_g: float
    protein_g: float
    nutrition_found: bool


class AnalysisResult(BaseModel):
    items: list[FoodItem]
    total_calories: float
    total_fat_g: float
    total_carb_g: float
    total_protein_g: float
    image_width: int
    image_height: int