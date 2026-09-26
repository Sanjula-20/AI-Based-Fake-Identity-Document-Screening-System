import cv2
import numpy as np

def preprocess_document_image(image_bytes: bytes) -> tuple[np.ndarray, dict]:
    """
    Decodes image and generates multi-stage preprocessed variants for OCR & detection:
    1. Original Color Image
    2. Grayscale Image
    3. CLAHE Contrast Enhanced Image
    4. Sharpened Image
    5. Perspective & Deskew Corrected Image
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    original_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if original_img is None:
        raise ValueError("Could not decode image bytes.")

    h, w = original_img.shape[:2]
    gray = cv2.cvtColor(original_img, cv2.COLOR_BGR2GRAY) if len(original_img.shape) == 3 else original_img.copy()

    # Bilateral noise reduction
    denoised = cv2.bilateralFilter(gray, 7, 50, 50)

    # CLAHE contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    contrast_enhanced = clahe.apply(denoised)

    # Kernel sharpening
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]], dtype=np.float32)
    sharpened = cv2.filter2D(contrast_enhanced, -1, kernel)

    # Perspective & Deskew correction
    perspective_corrected = original_img.copy()
    try:
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blur, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        largest_cnt = None
        max_area = 0
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > (h * w * 0.20): # At least 20% of image area
                peri = cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
                if len(approx) == 4 and area > max_area:
                    largest_cnt = approx
                    max_area = area

        if largest_cnt is not None:
            pts = largest_cnt.reshape(4, 2)
            rect = order_points(pts)
            (tl, tr, br, bl) = rect
            
            widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
            widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
            maxWidth = max(int(widthA), int(widthB))

            heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
            heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
            maxHeight = max(int(heightA), int(heightB))

            dst = np.array([
                [0, 0],
                [maxWidth - 1, 0],
                [maxWidth - 1, maxHeight - 1],
                [0, maxHeight - 1]
            ], dtype="float32")

            M = cv2.getPerspectiveTransform(rect, dst)
            perspective_corrected = cv2.warpPerspective(original_img, M, (maxWidth, maxHeight))
    except Exception:
        perspective_corrected = original_img.copy()

    variants = {
        "original": original_img,
        "gray": gray,
        "contrast_enhanced": contrast_enhanced,
        "sharpened": sharpened,
        "perspective_corrected": perspective_corrected
    }

    return original_img, variants

def order_points(pts: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect
