import re

def validate_passport_document(extracted_fields: dict, raw_text: str) -> dict:
    """
    Validates Passport document layout, Passport Number format (1 letter + 7 digits), and MRZ presence.
    """
    issues = []
    text_upper = raw_text.upper()
    doc_no = extracted_fields.get("documentNumber", {}).get("value")

    if not doc_no:
        match = re.search(r'\b[A-Z][0-9]{7}\b', text_upper)
        if match:
            doc_no = match.group(0)

    if not doc_no:
        issues.append("Passport Number ([A-Z][0-9]{7}) was not detected.")

    # MRZ check
    has_mrz = "P<IND" in text_upper or bool(re.search(r'P<[A-Z]{3}[A-Z<]{30,}', text_upper))
    if not has_mrz:
        issues.append("Machine Readable Zone (MRZ) pattern was not detected on passport.")

    is_valid = len(issues) == 0

    return {
        "isValid": is_valid,
        "documentType": "PASSPORT",
        "issues": issues,
        "validatedNumber": doc_no
    }
