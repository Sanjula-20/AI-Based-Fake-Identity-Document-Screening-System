import re

def validate_pan_document(extracted_fields: dict, raw_text: str) -> dict:
    """
    Validates PAN Card document format and field patterns.
    Pattern: [A-Z]{5}[0-9]{4}[A-Z]{1}
    4th character check: 'P' for Individual, 'C' for Company, 'H' for HUF, 'F' for Firm, 'A' for AOP, 'T' for Trust.
    """
    issues = []
    doc_no = extracted_fields.get("documentNumber", {}).get("value")

    if not doc_no:
        # Check raw text
        match = re.search(r'[A-Z]{5}[0-9]{4}[A-Z]{1}', raw_text.upper())
        if match:
            doc_no = match.group(0)

    if not doc_no:
        issues.append("PAN number string pattern ([A-Z]{5}[0-9]{4}[A-Z]{1}) was not detected.")
    else:
        if len(doc_no) != 10:
            issues.append(f"Invalid PAN length: {len(doc_no)} characters. Expected 10.")
        valid_4th_char = ['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G']
        if doc_no[3] not in valid_4th_char:
            issues.append(f"Invalid PAN entity code: '{doc_no[3]}' at position 4.")

    # Required headers check
    required_terms = ["INCOME TAX", "PERMANENT ACCOUNT"]
    missing_terms = [term for term in required_terms if term not in raw_text.upper()]
    if missing_terms:
        issues.append(f"Missing expected header keywords: {', '.join(missing_terms)}.")

    is_valid = len(issues) == 0

    return {
        "isValid": is_valid,
        "documentType": "PAN",
        "issues": issues,
        "validatedNumber": doc_no
    }
