import re

def validate_dl_document(extracted_fields: dict, raw_text: str) -> dict:
    """
    Validates Driving Licence format (State Code + Numbers).
    """
    issues = []
    text_upper = raw_text.upper()
    
    dl_match = re.search(r'\b[A-Z]{2}[0-9]{2}\s?[0-9]{11}\b|\b[A-Z]{2}-[0-9]{13}\b', text_upper)
    doc_no = dl_match.group(0) if dl_match else None

    if not doc_no:
        issues.append("Driving Licence number pattern (State code + 13-15 digits) was not detected.")

    required_keywords = ["DRIVING", "LICENCE", "MOTOR"]
    found = [kw for kw in required_keywords if kw in text_upper]
    if len(found) == 0:
        issues.append("Missing Driving Licence structural header keywords.")

    is_valid = len(issues) == 0

    return {
        "isValid": is_valid,
        "documentType": "DRIVING_LICENSE",
        "issues": issues,
        "validatedNumber": doc_no
    }
