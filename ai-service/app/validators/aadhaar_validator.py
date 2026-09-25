import re

def validate_aadhaar_document(extracted_fields: dict, raw_text: str) -> dict:
    """
    Validates Aadhaar 12-digit number format and UIDAI header structure.
    """
    issues = []
    text_upper = raw_text.upper()
    
    match = re.search(r'\b\d{4}\s?\d{4}\s?\d{4}\b', text_upper)
    doc_no = match.group(0).replace(" ", "") if match else None

    if not doc_no:
        issues.append("Aadhaar 12-digit UID number pattern was not detected.")
    elif len(doc_no) != 12:
        issues.append(f"Invalid Aadhaar number length ({len(doc_no)} digits). Expected 12 digits.")

    required_keywords = ["UNIQUE IDENTIFICATION", "GOVERNMENT OF INDIA", "AADHAAR"]
    found_keywords = [kw for kw in required_keywords if kw in text_upper]
    if len(found_keywords) == 0:
        issues.append("UIDAI header keywords were missing from document text.")

    is_valid = len(issues) == 0

    return {
        "isValid": is_valid,
        "documentType": "AADHAAR",
        "issues": issues,
        "validatedNumber": doc_no
    }
