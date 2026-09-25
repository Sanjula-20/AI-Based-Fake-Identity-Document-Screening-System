def evaluate_field_consistency(ocr_fields: dict, qr_data: dict, mrz_data: dict) -> dict:
    """
    Evaluates consistency across OCR, QR Code payload, and MRZ Machine Readable Zone.
    """
    details = []
    has_mismatch = False

    ocr_doc_no = ocr_fields.get("documentNumber", {}).get("value")

    # 1. Compare MRZ vs OCR
    if mrz_data.get("detected") and mrz_data.get("parsedMrz"):
        mrz_doc_no = mrz_data["parsedMrz"].get("documentNumber")
        if ocr_doc_no and mrz_doc_no:
            if ocr_doc_no.replace("<", "").strip() == mrz_doc_no.replace("<", "").strip():
                details.append(f"MRZ Document Number ({mrz_doc_no}) matches printed OCR Document Number.")
            else:
                has_mismatch = True
                details.append(f"MISMATCH: MRZ Document Number ({mrz_doc_no}) conflicts with printed OCR Number ({ocr_doc_no}).")

    # 2. Compare QR vs OCR
    if qr_data.get("detected") and qr_data.get("results"):
        qr_payload = " ".join([r.get("payload", "") for r in qr_data["results"]]).upper()
        if ocr_doc_no:
            if ocr_doc_no.upper() in qr_payload:
                details.append(f"QR payload contains matching Document ID ({ocr_doc_no}).")
            else:
                # QR detected but ID missing
                details.append("QR Code decoded, but printed OCR document number was not found inside QR payload.")

    if not details:
        details.append("No conflicting fields detected across machine-readable and printed regions.")

    status = "MISMATCH" if has_mismatch else ("HIGH" if len(details) > 1 else "CONSISTENT")

    return {
        "status": status,
        "details": details,
        "hasMismatch": has_mismatch
    }
