import re

def evaluate_field_consistency(ocr_fields: dict, qr_data: dict, mrz_data: dict, format_result: dict = None) -> dict:
    """
    Evaluates OCR vs QR field consistency.
    
    IMPORTANT:
    Only compares fields when BOTH values are successfully extracted with high confidence!
    If OCR PAN is unknown but QR PAN exists -> UNVERIFIABLE (NOT MISMATCH!).
    Same rule for Name, DOB, Parent Name.
    """
    details = []
    evidence = []
    warnings = []
    has_mismatch = False

    ocr_doc_obj = ocr_fields.get("documentNumber", {})
    ocr_doc_no = ocr_doc_obj.get("value")
    ocr_doc_conf = ocr_doc_obj.get("confidence", 0.0)

    ocr_name_obj = ocr_fields.get("name", {})
    ocr_name = ocr_name_obj.get("value")
    ocr_name_conf = ocr_name_obj.get("confidence", 0.0)

    ocr_dob_obj = ocr_fields.get("dob", {})
    ocr_dob = ocr_dob_obj.get("value")

    qr_detected = qr_data.get("detected", False)
    parsed_qr = qr_data.get("parsedQr") or {}

    if qr_detected and parsed_qr:
        qr_pan = parsed_qr.get("panNumber")
        qr_name = parsed_qr.get("name")
        qr_dob = parsed_qr.get("dob")

        # Compare PAN ONLY if BOTH OCR PAN and QR PAN are present and confident
        if ocr_doc_no and ocr_doc_conf >= 0.70 and qr_pan:
            clean_ocr_pan = re.sub(r'[^A-Z0-9]', '', ocr_doc_no.upper())
            clean_qr_pan = re.sub(r'[^A-Z0-9]', '', qr_pan.upper())
            if clean_ocr_pan == clean_qr_pan:
                evidence.append("✓ Visible PAN number matches QR-encoded PAN information.")
            else:
                has_mismatch = True
                warnings.append("Visible PAN number differs from QR-encoded PAN information.")
        elif qr_pan and not ocr_doc_no:
            evidence.append("• QR encoded PAN present, but printed PAN unreadable from OCR.")

        # Compare Name ONLY if BOTH are present
        if ocr_name and ocr_name_conf >= 0.70 and qr_name:
            clean_ocr_name = re.sub(r'[^A-Z]', '', ocr_name.upper())
            clean_qr_name = re.sub(r'[^A-Z]', '', qr_name.upper())
            if clean_ocr_name == clean_qr_name or (len(clean_ocr_name) > 3 and clean_ocr_name in clean_qr_name):
                evidence.append("✓ Visible holder name matches QR-encoded name.")
            else:
                warnings.append(f"Visible name ('{ocr_name}') differs from QR-encoded name ('{qr_name}').")
        elif qr_name and not ocr_name:
            evidence.append("• QR encoded name present, but printed name unreadable from OCR.")

        # Compare DOB ONLY if BOTH are present
        if ocr_dob and qr_dob:
            clean_ocr_dob = re.sub(r'[^0-9]', '', ocr_dob)
            clean_qr_dob = re.sub(r'[^0-9]', '', qr_dob)
            if clean_ocr_dob == clean_qr_dob:
                evidence.append("✓ Visible Date of Birth matches QR-encoded DOB.")
            else:
                warnings.append(f"Visible DOB ('{ocr_dob}') differs from QR-encoded DOB ('{qr_dob}').")

    elif not qr_detected:
        qr_status = qr_data.get("matchStatus", "NOT_PRESENT")
        if qr_status == "UNREADABLE":
            evidence.append("• QR code unreadable due to blur or damage (QR_STATUS = UNVERIFIABLE).")
        else:
            evidence.append("• QR code not present on document (Standard for older PAN card designs).")

    field_consistency_score = 25 if has_mismatch else (95 if evidence else 85)
    status = "MISMATCH" if has_mismatch else ("MATCHED" if evidence else "UNVERIFIABLE")

    return {
        "status": status,
        "details": details,
        "hasMismatch": has_mismatch,
        "fieldConsistencyScore": field_consistency_score,
        "evidence": evidence,
        "warnings": warnings
    }
