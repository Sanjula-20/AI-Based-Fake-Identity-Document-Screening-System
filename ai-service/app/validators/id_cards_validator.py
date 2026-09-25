import re

def validate_id_card_document(extracted_fields: dict, raw_text: str, doc_type: str = "COLLEGE_ID") -> dict:
    """
    Validates College ID or Employee ID structure.
    """
    issues = []
    text_upper = raw_text.upper()

    if doc_type == "COLLEGE_ID":
        keywords = ["STUDENT", "COLLEGE", "UNIVERSITY", "ROLL", "REGISTRATION"]
    else:
        keywords = ["EMPLOYEE", "STAFF", "CORPORATE", "EMP", "ACCESS"]

    found = [kw for kw in keywords if kw in text_upper]
    if len(found) == 0:
        issues.append(f"Document missing structural keywords expected for {doc_type}.")

    is_valid = len(issues) == 0

    return {
        "isValid": is_valid,
        "documentType": doc_type,
        "issues": issues,
        "validatedNumber": extracted_fields.get("documentNumber", {}).get("value")
    }
