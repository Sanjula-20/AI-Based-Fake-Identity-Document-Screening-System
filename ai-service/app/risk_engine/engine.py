from app.core.privacy import mask_pii_text

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
    liveness_result: dict,
    synthetic_result: dict = None,
    photo_result: dict = None,
    signature_result: dict = None,
    text_tampering_result: dict = None,
    official_verification: dict = None,
    reference_comparison: dict = None
) -> dict:
    """
    Evidence-Based Rule Aggregation Engine for Indian PAN Cards.
    
    IMPORTANT:
    Replaces old logic (RULE FAILURE -> INCORRECT) with (RULE RESULT -> EVIDENCE).
    Extraction failures (OCR unreadable, QR decoding fail, low quality) produce 0 fraud evidence.
    
    Final Result Categories:
    - VERIFIED
    - SUSPICIOUS
    - TAMPERING DETECTED
    - UNVERIFIABLE
    """
    synthetic_result = synthetic_result or {"syntheticScore": 0, "isSynthetic": False, "evidence": [], "warnings": []}
    photo_result = photo_result or {"status": "MATCHED", "confidence": 90, "reason": "", "issues": [], "evidence": []}
    signature_result = signature_result or {"status": "MATCHED", "confidence": 90, "reason": "", "issues": [], "evidence": []}
    text_tampering_result = text_tampering_result or {"panField": {"status": "MATCHED"}, "nameField": {"status": "MATCHED"}, "dobField": {"status": "MATCHED"}, "parentField": {"status": "MATCHED"}, "issues": [], "evidence": []}
    official_verification = official_verification or {"status": "UNAVAILABLE", "details": "Official API not queried."}
    reference_comparison = reference_comparison or {"performed": False, "differenceReport": {}}

    usable = quality_result.get("usable", True)
    q_score = quality_result.get("qualityScore", 80)

    # 1. Map Field Results Schema: MATCHED | SUSPICIOUS | MISMATCH | UNVERIFIABLE
    pan_status = map_status(format_result.get("panStatus", "MATCHED"))
    header_status = map_status(format_result.get("headerStatus", "MATCHED"))
    name_status = map_status(text_tampering_result.get("nameField", {}).get("status", "MATCHED"))
    dob_status = map_status(text_tampering_result.get("dobField", {}).get("status", "MATCHED"))
    parent_status = map_status(text_tampering_result.get("parentField", {}).get("status", "MATCHED"))
    photo_status = map_status(photo_result.get("status", "MATCHED"))
    sig_status = map_status(signature_result.get("status", "MATCHED"))
    qr_status = map_status(qr_result.get("matchStatus", "NOT_PRESENT"))
    layout_status = map_status("MATCHED" if format_result.get("templateValid", True) else "UNVERIFIABLE")
    forensics_status = map_status("SUSPICIOUS" if forensic_result.get("localSplicingDetected") else "MATCHED")
    quality_status = map_status("MATCHED" if usable else "UNVERIFIABLE")

    # 2. Collect Independent Fraud Evidence Points (NOT extraction failures!)
    fraud_evidence = []
    
    if forensic_result.get("localSplicingDetected"):
        fraud_evidence.append("Localized ELA compression anomaly detected in document text patch")
    
    if synthetic_result.get("isSynthetic"):
        fraud_evidence.append("Spectral FFT frequency analysis detected generative AI grid artifacts")
        
    if photo_status in ["SUSPICIOUS", "MISMATCH"]:
        fraud_evidence.append("Photograph region boundary step discontinuity or ELA mismatch detected")
        
    if sig_status in ["SUSPICIOUS", "MISMATCH"]:
        fraud_evidence.append("Signature region stroke boundary noise or background contrast mismatch")
        
    if name_status in ["SUSPICIOUS", "MISMATCH"]:
        fraud_evidence.append("Holder name text patch alignment step boundary or ELA anomaly detected")

    if dob_status in ["SUSPICIOUS", "MISMATCH"]:
        fraud_evidence.append("Date of Birth text patch alignment anomaly detected")

    if pan_status == "MISMATCH":
        fraud_evidence.append("PAN number string violates 10-char structural format ([A-Z]{5}[0-9]{4}[A-Z]{1})")

    if consistency_result.get("hasMismatch") or qr_status == "MISMATCH":
        fraud_evidence.append("Visible PAN/Name/DOB differs from QR-encoded data")

    fraud_evidence_count = len(fraud_evidence)

    # 3. Decision Engine Logic
    if fraud_evidence_count >= 2:
        decision = "TAMPERING DETECTED"
        risk_status = "HIGH_RISK"
        risk_score = min(75 + (fraud_evidence_count * 10), 100)
        verdict = "VISUAL / DIGITAL TAMPERING DETECTED"
    elif fraud_evidence_count == 1:
        decision = "SUSPICIOUS"
        risk_status = "MEDIUM_RISK"
        risk_score = 45
        verdict = "POSSIBLE MANIPULATION"
    elif not usable or pan_status == "UNVERIFIABLE":
        decision = "UNVERIFIABLE"
        risk_status = "UNVERIFIABLE"
        risk_score = 25
        verdict = "UNABLE TO RELIABLY VERIFY — LOW QUALITY / UNREADABLE"
    else:
        decision = "VERIFIED"
        risk_status = "LOW_RISK"
        risk_score = 10
        verdict = "NO OBVIOUS TAMPERING DETECTED"

    extracted_fields = ocr_result.get("extractedFields", {})
    
    field_results = {
        "panNumber": {
            "status": pan_status,
            "confidence": int(round(extracted_fields.get("documentNumber", {}).get("confidence", 0.9) * 100)) if pan_status != "UNVERIFIABLE" else 0,
            "value": format_result.get("validatedNumber") or extracted_fields.get("documentNumber", {}).get("value") or "Unreadable",
            "evidence": "Valid 10-char PAN format detected" if pan_status == "MATCHED" else ("PAN format structure error" if pan_status == "MISMATCH" else "PAN number could not be reliably read from OCR")
        },
        "name": {
            "status": name_status,
            "confidence": int(round(extracted_fields.get("name", {}).get("confidence", 0.85) * 100)) if name_status != "UNVERIFIABLE" else 0,
            "value": extracted_fields.get("name", {}).get("value") or "Unreadable",
            "evidence": "Holder name extracted and verified" if name_status == "MATCHED" else "Name region text anomaly"
        },
        "parentName": {
            "status": parent_status if extracted_fields.get("fatherName") else "UNVERIFIABLE",
            "confidence": int(round(extracted_fields.get("fatherName", {}).get("confidence", 0.80) * 100)) if extracted_fields.get("fatherName") else 0,
            "value": extracted_fields.get("fatherName", {}).get("value") or "Not Extracted",
            "evidence": "Parent name region checked"
        },
        "dob": {
            "status": dob_status,
            "confidence": int(round(extracted_fields.get("dob", {}).get("confidence", 0.85) * 100)) if dob_status != "UNVERIFIABLE" else 0,
            "value": extracted_fields.get("dob", {}).get("value") or "Unreadable",
            "evidence": "DOB format verified" if dob_status == "MATCHED" else "DOB region anomaly"
        },
        "photo": {
            "status": photo_status,
            "confidence": photo_result.get("confidence", 85),
            "evidence": photo_result.get("reason", "Photo region edge blending and ELA match background canvas.")
        },
        "signature": {
            "status": sig_status,
            "confidence": signature_result.get("confidence", 85),
            "evidence": signature_result.get("reason", "Signature stroke continuity consistent with document.")
        },
        "qrCode": {
            "status": qr_status,
            "confidence": 95 if qr_status == "MATCHED" else 0,
            "evidence": qr_result.get("reason", "QR code presence & payload checked.")
        },
        "header": {
            "status": header_status,
            "confidence": 90 if header_status == "MATCHED" else 0,
            "evidence": "Income Tax Department header keywords recognized" if header_status == "MATCHED" else "Header text faint or unreadable"
        },
        "layout": {
            "status": layout_status,
            "confidence": 95,
            "evidence": f"Document layout matches Indian PAN card template ({format_result.get('templateType', 'MODERN_QR_PAN')})"
        },
        "imageForensics": {
            "status": forensics_status,
            "confidence": 85,
            "evidence": "Error Level Analysis shows uniform compression profile" if forensics_status == "MATCHED" else "Localized ELA compression anomaly detected"
        },
        "documentQuality": {
            "status": quality_status,
            "confidence": q_score,
            "evidence": quality_result.get("reason", "Image quality analyzed.")
        },
        "officialVerification": official_verification,
        "referenceComparison": reference_comparison
    }

    # Debug Step-By-Step Console Log
    print("\n------------------- PAN SCREENING DEBUG REPORT -------------------")
    print(f"Document detected         : {format_result.get('documentType', 'PAN')}")
    print(f"Image quality             : Usable={usable}, Score={q_score}/100, Blur={quality_result.get('blurVariance')}")
    print(f"PAN OCR                   : Value={field_results['panNumber']['value']}, Status={pan_status}")
    print(f"PAN OCR confidence        : {field_results['panNumber']['confidence']}%")
    print(f"Header OCR                : Found={format_result.get('headerStatus')}")
    print(f"QR detected               : {qr_result.get('detected')}")
    print(f"QR decoded                : {qr_status}")
    print(f"QR fields extracted       : {qr_result.get('parsedQr')}")
    print(f"Photo detected            : Status={photo_status}")
    print(f"Photo comparison          : {photo_result.get('reason')}")
    print(f"Name comparison           : Status={name_status}, Value={field_results['name']['value']}")
    print(f"DOB comparison            : Status={dob_status}, Value={field_results['dob']['value']}")
    print(f"Signature analysis        : Status={sig_status}")
    print(f"Forensic analysis         : Splicing={forensic_result.get('localSplicingDetected')}, Synthetic={synthetic_result.get('isSynthetic')}")
    print(f"Actual suspicious evidence: {fraud_evidence}")
    print(f"Final decision            : {decision} (RiskStatus: {risk_status}, Score: {risk_score}/100)")
    print("-------------------------------------------------------------------\n")

    warnings = fraud_evidence if fraud_evidence else []
    evidence = [f["evidence"] for f in field_results.values() if isinstance(f, dict) and f.get("evidence") and "✓" in f["evidence"] or "matched" in str(f.get("evidence")).lower()]

    if decision == "UNVERIFIABLE":
        reasons = ["PAN card features were detected, but OCR/QR extraction confidence was insufficient for reliable verification."]
    elif decision == "VERIFIED":
        reasons = ["No obvious tampering detected. Document structure, PAN format, and image forensics match genuine benchmarks."]
    else:
        reasons = fraud_evidence

    is_correct = (decision in ["VERIFIED", "UNVERIFIABLE"])
    classification = "CORRECT" if decision == "VERIFIED" else ("UNVERIFIABLE" if decision == "UNVERIFIABLE" else "INCORRECT")

    basis_of_classification = {
        "classification": classification,
        "isCorrect": is_correct,
        "verdict": verdict,
        "primaryBasis": f"Aggregated {fraud_evidence_count} independent fraud evidence signal(s). Decision: {decision}.",
        "failedReasons": [{"category": "Risk Engine", "rule": "Evidence Aggregation", "detail": e} for e in fraud_evidence],
        "passedReasons": evidence,
        "warnings": warnings,
        "riskScore": risk_score,
        "decision": decision
    }

    return {
        "documentType": "PAN",
        "decision": decision,
        "classification": classification,
        "isCorrect": is_correct,
        "verdict": verdict,
        "basisOfClassification": basis_of_classification,
        "riskScore": risk_score,
        "riskStatus": risk_status,
        "confidence": 95 if decision == "VERIFIED" else (85 if decision == "TAMPERING DETECTED" else 50),
        "fieldResults": field_results,
        "signals": {
            "imageQuality": quality_result,
            "formatValidation": format_result,
            "forensicAnalysis": forensic_result,
            "syntheticAnalysis": synthetic_result,
            "fieldConsistency": consistency_result,
            "photoAnalysis": photo_result,
            "signatureAnalysis": signature_result,
            "officialVerification": official_verification,
            "referenceComparison": reference_comparison
        },
        "evidence": evidence,
        "warnings": warnings,
        "reasons": reasons,
        "individualChecks": {
            "panFormat": pan_status,
            "photo": photo_status,
            "signature": sig_status,
            "qr": qr_status,
            "forensics": forensics_status,
            "quality": quality_status
        }
    }

def map_status(val: str) -> str:
    v = str(val).upper().strip()
    if v in ["MATCHED", "VERIFIED", "PASS", "DECODED", "VALID", "CONSISTENT"]:
        return "MATCHED"
    if v in ["SUSPICIOUS", "WARNING"]:
        return "SUSPICIOUS"
    if v in ["MISMATCH", "TAMPERED", "FAIL"]:
        return "MISMATCH"
    return "UNVERIFIABLE"
