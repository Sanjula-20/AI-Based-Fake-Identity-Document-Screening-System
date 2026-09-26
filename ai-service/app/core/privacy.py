import re

def mask_pii_text(text: str) -> str:
    """
    Masks sensitive personally identifiable information (PII) for privacy compliance in logs.
    """
    if not text:
        return ""

    # Mask 10-character PAN number: ABCDE1234F -> ABCDE****F
    text = re.sub(r'\b([A-Z]{5})\d{4}([A-Z])\b', r'\1****\2', text)

    # Mask Date of Birth: 15/08/1995 -> **/**/1995
    text = re.sub(r'\b(\d{2})[-/. ](\d{2})[-/. ](\d{4})\b', r'**/**/\3', text)

    # Mask Aadhaar number: 1234 5678 9012 -> **** **** 9012
    text = re.sub(r'\b\d{4}\s?\d{4}\s?(\d{4})\b', r'**** **** \1', text)

    return text

def mask_name(name: str) -> str:
    """
    Masks individual name: 'SANJULA SHARMA' -> 'S*** S***'
    """
    if not name:
        return ""
    words = name.strip().split()
    masked_words = [f"{w[0]}***" if len(w) > 1 else w for w in words]
    return " ".join(masked_words)
