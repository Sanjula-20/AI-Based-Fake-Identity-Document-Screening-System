import re
from app.core.privacy import mask_pii_text

def validate_pan_document(extracted_fields: dict, raw_text: str, ocr_lines: list = None, header_found: bool = True) -> dict:
    """
    PAN Structural Format & Header Validator:
    - 1. PAN Number Format & Regex ([A-Z]{5}[0-9]{4}[A-Z]{1})
    - 2. 4th Character Entity Code Verification (P, C, H, F, A, T, B, L, J, G)
    - 3. 5th Character Surname Initial Verification
    - 4. Income Tax Department Header Keyword Verification (Fuzzy Matching)
    
    IMPORTANT:
    If OCR does not extract a candidate PAN or OCR is weak:
    panStatus = "UNVERIFIABLE" (NOT FRAUD!)
    Only trigger "MISMATCH" when OCR successfully extracts a clear candidate that violates structure.
    """
    issues = []
    evidence = []
    warnings = []

    doc_no_obj = extracted_fields.get("documentNumber", {})
    doc_no = doc_no_obj.get("value")
    ocr_conf = doc_no_obj.get("confidence", 0.0)
    raw_upper = raw_text.upper() if raw_text else ""

    if not doc_no:
        match = re.search(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b', raw_upper)
        if match:
            doc_no = match.group(0)
            ocr_conf = 0.95

    valid_pan_format = False
    entity_type = "Unknown"
    fourth_char = None
    fifth_char = None
    pan_status = "UNVERIFIABLE"

    if doc_no and ocr_conf >= 0.70:
        clean_doc_no = doc_no.strip().upper()
        if len(clean_doc_no) == 10 and re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', clean_doc_no):
            valid_4th_char = {
                'P': 'Individual Person',
                'C': 'Company',
                'H': 'HUF (Hindu Undivided Family)',
                'F': 'Firm / Partnership',
                'A': 'Association of Persons (AOP)',
                'T': 'Trust',
                'B': 'Body of Individuals (BOI)',
                'L': 'Local Authority',
                'J': 'Artificial Juridical Person',
                'G': 'Government Agency'
            }
            fourth_char = clean_doc_no[3]
            fifth_char = clean_doc_no[4]

            if fourth_char in valid_4th_char:
                valid_pan_format = True
                entity_type = valid_4th_char[fourth_char]
                masked_no = mask_pii_text(clean_doc_no)
                pan_status = "MATCHED"
                evidence.append(f"✓ Valid 10-char PAN format detected ({masked_no}, 4th Char '{fourth_char}': {entity_type})")
            else:
                pan_status = "MISMATCH"
                issues.append(f"Invalid PAN 4th entity code character '{fourth_char}' at position 4. Must be one of (P, C, H, F, A, T, B, L, J, G).")
        else:
            pan_status = "MISMATCH"
            issues.append(f"Invalid PAN string format: '{mask_pii_text(clean_doc_no)}'. Must be 5 letters + 4 digits + 1 letter.")
    else:
        pan_status = "UNVERIFIABLE"
        evidence.append("• PAN number could not be reliably extracted from OCR text.")

    # 2. Header Validation (Fuzzy Match)
    header_status = "MATCHED" if header_found else "UNVERIFIABLE"
    if header_found:
        evidence.append("✓ Income Tax Department header keywords recognized.")
    else:
        evidence.append("• Income Tax Department header text unreadable or faint.")

    # 3. Surname Initial Verification
    holder_name = extracted_fields.get("name", {}).get("value")
    if valid_pan_format and fifth_char and holder_name:
        name_parts = [p.strip() for p in holder_name.split() if len(p.strip()) > 1]
        if name_parts:
            surname = name_parts[-1].upper()
            expected_initial = surname[0]
            if fifth_char == expected_initial:
                evidence.append(f"✓ 5th character of PAN ('{fifth_char}') matches holder surname initial ('{expected_initial}' for {surname})")

    template_type = "MODERN_QR_PAN" if "QR" in raw_upper else "OLDER_DESIGN_PAN"

    return {
        "isValid": valid_pan_format,
        "validFormat": valid_pan_format,
        "documentType": "PAN",
        "templateType": template_type,
        "entityType": entity_type,
        "panStatus": pan_status,
        "headerStatus": header_status,
        "validatedNumber": mask_pii_text(doc_no) if doc_no else None,
        "rawPanNumber": doc_no,
        "issues": issues,
        "evidence": evidence,
        "warnings": warnings
    }
