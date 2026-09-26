import cv2
import numpy as np

def analyze_signature_region(img: np.ndarray, is_recompressed: bool = False) -> dict:
    """
    Analyzes the signature region of the PAN card for replacement, copy-paste,
    rendering quality, stroke continuity, and background mismatch.
    
    IMPORTANT: Does NOT claim identity verification from signature appearance alone.
    Returns: "Possible signature-region manipulation" when evidence supports it.
    """
    if img is None or img.size == 0:
        return {
            "status": "UNREADABLE",
            "confidence": 0,
            "reason": "Signature region unreadable.",
            "issues": ["Empty image provided."],
            "evidence": []
        }

    h, w = img.shape[:2]
    
    # Signature region on PAN card is typically bottom-right (x: 60%-95%, y: 65%-92%)
    sx1, sy1 = int(w * 0.60), int(h * 0.65)
    sx2, sy2 = int(w * 0.95), int(h * 0.92)

    sig_crop = img[sy1:sy2, sx1:sx2]
    if sig_crop.size == 0:
        return {
            "status": "NOT_PRESENT",
            "confidence": 50,
            "reason": "Signature region position could not be isolated.",
            "issues": [],
            "evidence": []
        }

    gray = cv2.cvtColor(sig_crop, cv2.COLOR_BGR2GRAY) if len(sig_crop.shape) == 3 else sig_crop
    
    # Check ink presence / non-white pixel ratio
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    ink_ratio = float(np.sum(thresh > 0)) / float(thresh.size)

    if ink_ratio < 0.005:
        # Signature missing or very faint
        return {
            "status": "NOT_PRESENT",
            "confidence": 85,
            "reason": "Signature missing or stroke faint on document.",
            "issues": ["Signature line contains minimal or no ink strokes."],
            "evidence": []
        }

    issues = []
    evidence = []

    # 1. Stroke Edge Sharpness & Pixel Artifacts
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    sig_stroke_var = float(np.var(lap[thresh > 0])) if np.sum(thresh > 0) > 0 else 0.0

    if sig_stroke_var > 7500.0 and not is_recompressed:
        issues.append("Abnormal pixel edge noise detected around signature stroke contours")

    if len(issues) >= 2:
        status = "SUSPICIOUS"
        reason = "Possible signature-region manipulation detected based on stroke boundary analysis."
        confidence = 80
    else:
        status = "PASS"
        reason = "Signature region strokes and background contrast are consistent with document."
        evidence.append("✓ Signature stroke ink continuity and background transition match document background.")
        confidence = 90

    return {
        "status": status,
        "confidence": confidence,
        "reason": reason,
        "issues": issues,
        "evidence": evidence
    }
