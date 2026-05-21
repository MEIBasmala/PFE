from app.config import CONF_THRESHOLD
from app.core.model_loader import model
from app.models.schemas import FoodItem
from app.services.nutrition_service import lookup_nutrition
from app.services.portion_service import estimate_grams_from_mask


def run_inference(img_np, img_h, img_w):

    image_area = img_h * img_w

    results = model(
        img_np,
        conf=CONF_THRESHOLD,
        verbose=False,
    )[0]

    items = []

    if results.boxes is not None and len(results.boxes):

        boxes = results.boxes
        masks = results.masks
        class_names = model.names

        for i, box in enumerate(boxes):

            cls_id = int(box.cls[0].item())
            class_name = class_names[cls_id]

            confidence = float(box.conf[0].item())

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            # Mask area
            if masks is not None and i < len(masks.data):

                mask_np = masks.data[i].cpu().numpy()
                mask_area_px = float(mask_np.sum())

            else:
                mask_area_px = (x2 - x1) * (y2 - y1)

            # Portion estimation
            portion_g = estimate_grams_from_mask(
                mask_area_px,
                image_area,
            )

            # Nutrition lookup
            nutrition = lookup_nutrition(class_name)

            found = nutrition is not None

            if found:

                calories = nutrition["cal_per_g"] * portion_g
                fat_g = nutrition["fat_per_g"] * portion_g
                carb_g = nutrition["carb_per_g"] * portion_g
                protein_g = nutrition["protein_per_g"] * portion_g

            else:
                calories = 0.0
                fat_g = 0.0
                carb_g = 0.0
                protein_g = 0.0

            items.append(
                FoodItem(
                    class_name=class_name,
                    confidence=round(confidence, 4),
                    bbox=[round(v, 1) for v in [x1, y1, x2, y2]],
                    mask_area_px=round(mask_area_px, 1),
                    portion_g=round(portion_g, 1),
                    calories=round(calories, 1),
                    fat_g=round(fat_g, 2),
                    carb_g=round(carb_g, 2),
                    protein_g=round(protein_g, 2),
                    nutrition_found=found,
                )
            )

    return items