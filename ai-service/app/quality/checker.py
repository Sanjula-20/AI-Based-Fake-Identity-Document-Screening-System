import cv2
import numpy as np

def check_image_quality(image_bytes: bytes) -> dict:
    """
    Analyzes document image quality: resolution, blur, brightness, contrast, and glare.
    Returns structured quality metrics and usability flags.
    """
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {
                "usable": False,
                "qualityScore": 0.0,
                "issues": ["Unable to decode image file. File may be corrupted or invalid format."]
            }

        height, width = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1. Blur Detection (Laplacian Variance)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        # 2. Brightness & Contrast
        brightness = float(np.mean(gray))
        contrast = float(np.std(gray))

        # 3. Glare Detection (percentage of overexposed pixels > 248)
        glare_mask = gray > 248
        glare_percent = float(np.sum(glare_mask) / (height * width)) * 100.0

        issues = []
        scores = []

        # Resolution check
        if width < 300 or height < 300:
            issues.append(f"Low image resolution ({width}x{height}px). Minimum 400x400px recommended.")
            scores.append(0.4)
        else:
            scores.append(1.0)

        # Blur check
        if laplacian_var < 50.0:
            issues.append(f"Severe blur detected (Variance: {laplacian_var:.1f}). Please upload a sharper image.")
            scores.append(0.3)
        elif laplacian_var < 100.0:
            issues.append(f"Moderate blur detected (Variance: {laplacian_var:.1f}).")
            scores.append(0.7)
        else:
            scores.append(1.0)

        # Brightness check
        if brightness < 40:
            issues.append("Image is too dark.")
            scores.append(0.5)
        elif brightness > 220:
            issues.append("Image is overexposed / too bright.")
            scores.append(0.5)
        else:
            scores.append(1.0)

        # Glare check
        if glare_percent > 15.0:
            issues.append(f"High glare/reflections detected ({glare_percent:.1f}% of image).")
            scores.append(0.6)
        else:
            scores.append(1.0)

        overall_quality = float(np.mean(scores))
        usable = overall_quality >= 0.55 and laplacian_var >= 40.0

        return {
            "usable": usable,
            "qualityScore": round(overall_quality, 2),
            "resolution": [width, height],
            "blurVariance": round(laplacian_var, 1),
            "brightness": round(brightness, 1),
            "contrast": round(contrast, 1),
            "glarePercent": round(glare_percent, 1),
            "issues": issues
        }
    except Exception as e:
        return {
            "usable": False,
            "qualityScore": 0.0,
            "issues": [f"Image quality analysis failed: {str(e)}"]
        }
