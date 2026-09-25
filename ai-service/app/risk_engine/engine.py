def calculate_fraud_risk(
    quality_result: dict,
    ocr_result: dict,
    format_result: dict,
    tampering_result: dict,
    forensic_result: dict,
    qr_result: dict,
    mrz_result: dict,
    consistency_result: dict,
    face_result: dict,
    liveness_result: dict
) -> dict:
    """
    Transparent multi-signal fraud evidence aggregation engine.
    Combines independent AI & algorithmic signals to determine risk score and status.
    """
    risk_score = 0
    reasons = []

    # 1. Quality Check
    if not quality_result.get("usable", True):
        risk_score += 35
        reasons.append("Document image quality is insufficient for reliable analysis.")

    # 2. Format Validation
    if not format_result.get("isValid", True):
        risk_score += 20
        for issue in format_result.get("issues", []):
            reasons.append(f"Format Validation Warning: {issue}")

    # 3. Tampering AI & Forensics
    tampered_prob = tampering_result.get("tamperedProbability", 0.0)
    if tampered_prob >= 0.70:
        risk_score += 45
        reasons.append(f"High tampering probability ({int(tampered_prob*100)}%) detected in document image.")
    elif tampered_prob >= 0.45:
        risk_score += 25
        reasons.append(f"Moderate tampering indicators ({int(tampered_prob*100)}%) detected.")

    if forensic_result.get("suspicious", False):
        risk_score += 20
        reasons.append("OpenCV Error Level Analysis (ELA) detected unnatural compression or noise variances.")

    # 4. Field Consistency & MRZ/QR
    if consistency_result.get("hasMismatch", False):
        risk_score += 30
        for d in consistency_result.get("details", []):
            if "MISMATCH" in d:
                reasons.append(d)

    if mrz_result.get("detected") and mrz_result.get("matchStatus") == "MISMATCH":
        risk_score += 25
        reasons.append("Passport Machine Readable Zone (MRZ) checksum validation failed.")

    # 5. Face Matching
    if face_result.get("attempted"):
        if face_result.get("matchStatus") == "MISMATCH":
            risk_score += 25
            reasons.append("Facial verification mismatch between ID portrait and selfie.")

    # Clamp risk score between 0 and 100
    final_score = min(max(risk_score, 0), 100)

    # Determine Status
    if not quality_result.get("usable", True):
        status = "UNABLE_TO_DETERMINE"
    elif final_score >= 65:
        status = "HIGH_RISK"
    elif final_score >= 30:
        status = "REVIEW_REQUIRED"
    else:
        status = "LOW_RISK"

    # Individual check badges for explainable report
    individual_checks = {
        "quality": "PASS" if quality_result.get("usable") else "FAIL",
        "ocr": "PASS" if ocr_result.get("avgConfidence", 0) >= 0.60 else "WARNING",
        "formatValidation": "PASS" if format_result.get("isValid") else "FAIL",
        "tampering": "FAIL" if tampering_result.get("prediction") == "TAMPERED" else "PASS",
        "qr": qr_result.get("matchStatus", "NOT_AVAILABLE"),
        "mrz": mrz_result.get("matchStatus", "NOT_AVAILABLE"),
        "face": face_result.get("matchStatus", "NOT_AVAILABLE"),
        "liveness": liveness_result.get("status", "NOT_AVAILABLE")
    }

    if not reasons:
        reasons.append("All structural, OCR, forensic, and machine-readable checks passed cleanly.")

    confidence = round(min(0.95, 0.70 + (ocr_result.get("avgConfidence", 0.8) * 0.25)), 2)

    return {
        "riskScore": final_score,
        "status": status,
        "confidence": confidence,
        "reasons": reasons,
        "individualChecks": individual_checks
    }
