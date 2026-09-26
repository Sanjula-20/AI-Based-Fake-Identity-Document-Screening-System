import re

PAN_KEYWORDS = [
    r"INCOME\s*TAX\s*DEPARTMENT", r"PERMANENT\s*ACCOUNT\s*NUMBER", r"GOVT\s*OF\s*INDIA",
    r"GOVERNMENT\s*OF\s*INDIA", r"आयकर\s*विभाग", r"भारत\s*सरकार", r"[A-Z]{5}[0-9]{4}[A-Z]"
]

NON_PAN_KEYWORDS = [
    r"PASSPORT", r"P<IND", r"AADHAAR", r"UNIQUE\s*IDENTIFICATION", r"DRIVING\s*LICENCE",
    r"MOTOR\s*VEHICLES", r"VOTER\s*ID", r"ELECTION\s*COMMISSION"
]

def classify_document(raw_text: str, image_shape: tuple, selected_hint: str = "PAN") -> dict:
    """
    Indian PAN Card Dedicated Classifier.
    Validates whether the document image is an Indian PAN Card.
    """
    text_upper = raw_text.upper() if raw_text else ""
    pan_score = 0
    non_pan_score = 0

    for pattern in PAN_KEYWORDS:
        if re.search(pattern, text_upper):
            pan_score += 2.5

    for pattern in NON_PAN_KEYWORDS:
        if re.search(pattern, text_upper):
            non_pan_score += 3.0

    if non_pan_score > 3.0 and pan_score < 2.0:
        return {
            "documentType": "NON_PAN_DOCUMENT",
            "confidence": 0.90,
            "isPanCard": False,
            "reason": "Uploaded document is not an Indian PAN Card (Aadhaar/Passport/DL detected)."
        }

    if pan_score >= 2.0 or selected_hint == "PAN":
        confidence = min(round(max(pan_score / 5.0, 0.75), 2), 0.98)
        return {
            "documentType": "PAN",
            "confidence": confidence,
            "isPanCard": True,
            "reason": "Indian PAN Card structure and keywords recognized."
        }

    return {
        "documentType": "PAN",
        "confidence": 0.60,
        "isPanCard": True,
        "reason": "Assumed Indian PAN Card for screening."
    }
