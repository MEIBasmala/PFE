import io

import numpy as np
from PIL import Image


Image.MAX_IMAGE_PIXELS = 20_000_000


def read_image(contents: bytes):
    pil_image = Image.open(io.BytesIO(contents)).convert("RGB")

    img_np = np.array(pil_image)

    img_h, img_w = img_np.shape[:2]

    return img_np, img_h, img_w