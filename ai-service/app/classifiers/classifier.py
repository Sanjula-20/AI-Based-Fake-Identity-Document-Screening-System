import re

DOCUMENT_KEYWORDS = {
    "PAN": [
        r"INCOME\s*TAX\s*DEPARTMENT", r"PERMANENT\s*ACCOUNT\s*NUMBER", r"GOVT\s*OF\s*INDIA",
        r"[A-Z]{5}[0-9]{4}[A-Z]"
    ],
    "PASSPORT": [
        r"REPUBLIC\s*OF\s*INDIA", r"PASSPORT", r"P<IND", r"SURNAME", r"GIVEN\s*NAMES"
    ],
    "AADHAAR": [
        r"UNIQUE\s*IDENTIFICATION", r"AUTHORITY\s*OF\s*INDIA", r"AADHAAR",
        r"GOVERNMENT\s*OF\s*INDIA", r"\d{4}\s*\d{4}\s*\d{4}"
    ],
    "DRIVING_LICENSE": [
        r"DRIVING\s*LICENCE", r"MOTOR\s*VEHICLES", r"UNION\s*OF\s*INDIA", r"TRANSPORT", r"DL\s*NO"
    ],
    "COLLEGE_ID": [
        r"STUDENT\s*ID", r"COLLEGE", r"UNIVERSITY", r"ACADEMIC\s*YEAR", r"ROLL\s*NO", r"REGISTRATION\s*NO"
    ],
    "EMPLOYEE_ID": [
        r"EMPLOYEE\s*ID", r"STAFF\s*ID", r"CORPORATE", r"EMP\s*CODE", r"COMPANY", r"ACCESS\s*CARD"
    ]
}

def classify_document(raw_text: str, image_shape: tuple, selected_hint: str = None) -> dict:
    """
    Classifies document type combining text keyword extraction, regex patterns, and image geometry.
    """
    text_upper = raw_text.upper() if raw_text else ""
    type_scores = {doc_type: 0 for doc_type in DOCUMENT_KEYWORDS}

    for doc_type, keywords in DOCUMENT_KEYWORDS.items():
        for pattern in keywords:
            if re.search(pattern, text_upper):
                type_scores[doc_type] += 2.5

    best_type = max(type_scores, key=type_scores.get)
    max_score = type_scores[best_type]

    # Calculate confidence ratio
    confidence = min(round(max_score / 5.0, 2), 0.98) if max_score > 0 else 0.40

    if confidence < 0.50 and selected_hint and selected_hint in DOCUMENT_KEYWORDS:
        best_type = selected_hint
        confidence = 0.70
    elif confidence < 0.40:
        best_type = "UNKNOWN"
        confidence = 0.0

    return {
        "documentType": best_type,
        "confidence": confidence,
        "matchScores": type_scores
    }
