import cv2
import numpy as np

def check_image_quality(image_bytes: bytes) -> dict:
    """
    Analyzes PAN document image quality before OCR & extraction:
    - blur & sharpness (Laplacian variance)
    - brightness & contrast
    - glare & overexposure
    - skew & perspective distortion
    - resolution & noise
    - compression artifacts
    
    IMPORTANT:
    If image quality is poor or unusable, returns status='UNVERIFIABLE'
    with message: "PAN detected, but image quality is insufficient for reliable verification."
    DO NOT SAY FAKE OR TAMPERED.
    """
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {
                "usable": False,
                "status": "UNVERIFIABLE",
                "qualityScore": 0.0,
                "isScreenshot": False,
                "isRecompressed": False,
                "aspectRatio": 0.0,
                "reason": "Unable to decode image file. File may be corrupted or in an invalid format.",
                "issues": ["Unable to decode image matrix."]
            }

        height, width = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        aspect_ratio = round(width / float(height), 2)
        megapixels = round((width * height) / 1000000.0, 2)

        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        sharpness_score = min(max(laplacian_var / 150.0, 0.0), 1.0)

        brightness = float(np.mean(gray))
        contrast = float(np.std(gray))

        glare_mask = gray > 248
        glare_percent = float(np.sum(glare_mask) / (height * width)) * 100.0

        edges = cv2.Canny(gray, 50, 150)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=80, maxLineGap=10)
        skew_angle = 0.0
        if lines is not None and len(lines) > 0:
            angles = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
                if abs(angle) < 45:
                    angles.append(angle)
            if angles:
                skew_angle = float(np.median(angles))

        is_screenshot = False
        common_screen_res = [(1920, 1080), (1080, 1920), (2400, 1080), (1080, 2400), (2340, 1080), (1280, 720), (2560, 1440), (1440, 2560)]
        if (width, height) in common_screen_res or aspect_ratio > 2.0 or aspect_ratio < 0.6:
            is_screenshot = True

        margin_top = gray[:int(height*0.1), :]
        margin_var = float(np.var(margin_top)) if margin_top.size > 0 else 0.0
        is_recompressed = margin_var < 15.0 or is_screenshot

        issues = []
        scores = []

        if width < 300 or height < 300:
            issues.append(f"Low resolution image ({width}x{height}px). Minimum 400x400px recommended.")
            scores.append(0.4)
        else:
            scores.append(1.0)

        if laplacian_var < 8.0:
            issues.append(f"Severe blur detected (Variance: {laplacian_var:.1f}).")
            scores.append(0.3)
        elif laplacian_var < 40.0:
            issues.append(f"Moderate blur detected (Variance: {laplacian_var:.1f}).")
            scores.append(0.7)
        else:
            scores.append(1.0)

        if brightness < 25:
            issues.append("Image is too dark.")
            scores.append(0.5)
        elif brightness > 240:
            issues.append("Image is overexposed.")
            scores.append(0.5)
        else:
            scores.append(1.0)

        if glare_percent > 25.0:
            issues.append(f"High glare detected ({glare_percent:.1f}% of image).")
            scores.append(0.6)
        else:
            scores.append(1.0)

        quality_score_100 = int(round(float(np.mean(scores)) * 100.0))
        usable = quality_score_100 >= 35 and laplacian_var >= 5.0

        status = "MATCHED" if usable and quality_score_100 >= 70 else ("SUSPICIOUS" if usable else "UNVERIFIABLE")
        reason = "Image quality is sufficient for document processing." if usable else "PAN detected, but image quality is insufficient for reliable verification."

        return {
            "usable": usable,
            "status": status,
            "qualityScore": quality_score_100,
            "resolution": [width, height],
            "megapixels": megapixels,
            "aspectRatio": aspect_ratio,
            "blurVariance": round(laplacian_var, 1),
            "sharpnessScore": round(sharpness_score, 2),
            "brightness": round(brightness, 1),
            "contrast": round(contrast, 1),
            "glarePercent": round(glare_percent, 1),
            "skewAngle": round(skew_angle, 1),
            "isScreenshot": is_screenshot,
            "isRecompressed": is_recompressed,
            "reason": reason,
            "issues": issues
        }
    except Exception as e:
        return {
            "usable": False,
            "status": "UNVERIFIABLE",
            "qualityScore": 0,
            "isScreenshot": False,
            "isRecompressed": False,
            "aspectRatio": 0.0,
            "reason": f"Image quality analysis error: {str(e)}",
            "issues": [f"Image quality check error: {str(e)}"]
        }
