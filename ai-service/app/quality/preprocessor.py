import cv2
import numpy as np

def preprocess_document_image(image_bytes: bytes) -> tuple[np.ndarray, np.ndarray]:
    """
    Decodes image and creates a normalized processed copy (CLAHE enhanced, resized)
    for downstream OCR and forensic model inference, keeping original raw bytes intact.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    original_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if original_img is None:
        raise ValueError("Could not decode image bytes.")

    # Convert to Grayscale
    gray = cv2.cvtColor(original_img, cv2.COLOR_BGR2GRAY)

    # Contrast Limited Adaptive Histogram Equalization (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_gray = clahe.apply(gray)

    return original_img, enhanced_gray
