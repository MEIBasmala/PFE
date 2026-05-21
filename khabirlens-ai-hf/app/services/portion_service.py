from app.config import DEFAULT_GRAMS


def estimate_grams_from_mask(
    mask_area_px: float,
    image_area_px: float,
) -> float:

    if image_area_px == 0 or mask_area_px == 0:
        return DEFAULT_GRAMS

    fraction = mask_area_px / image_area_px

    estimated = fraction * 400.0

    return float(max(20.0, min(350.0, estimated)))