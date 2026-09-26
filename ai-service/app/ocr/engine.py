import re
import cv2
import numpy as np

FUZZY_HEADER_PATTERNS = [
    r"INCOME\s*TAX\s*DEPAR?T?M?E?N?T?",
    r"PERMANENT\s*ACCOUNT\s*NUMB?E?R?",
    r"GOVT\.?\s*OF\s*INDIA",
    r"GOVERNMENT\s*OF\s*INDIA",
    r"आयकर\s*विभाग",
    r"भारत\s*सरकार"
]

def extract_ocr_text_and_fields(img: np.ndarray, doc_type: str = "PAN", variants: dict = None) -> dict:
    """
    Multi-stage OCR field extractor:
    Runs OCR across multiple preprocessed image variants (original, grayscale, contrast-enhanced, sharpened, perspective-corrected)
    and header crops to extract PAN number, Name, Father's Name, DOB, and Header.
    """
    variants = variants or {"original": img}
    all_raw_text = ""
    extracted_lines = []

    # 1. Run OCR on variants using PyTesseract if available
    try:
        import pytesseract
        for var_name, var_img in variants.items():
            if var_img is None: continue
            text = pytesseract.image_to_string(var_img, config='--psm 11')
            if text and len(text.strip()) > 3:
                all_raw_text += " " + text.strip()
                for line in text.split('\n'):
                    clean_l = line.strip()
                    if len(clean_l) > 2:
                        extracted_lines.append({"text": clean_l, "confidence": 0.90, "source": var_name})
    except Exception:
        pass

    # 2. Extract embedded QR payload text if present
    try:
        from app.mrz_qr.decoder import decode_qr_and_barcode
        qr_data = decode_qr_and_barcode(img)
        if qr_data.get("detected") and qr_data.get("results"):
            for res in qr_data["results"]:
                payload = res.get("payload", "")
                if payload:
                    all_raw_text += " " + payload
                    extracted_lines.append({"text": payload, "confidence": 0.99, "source": "QR_PAYLOAD"})
    except Exception:
        pass

    all_raw_text = all_raw_text.strip()

    # 3. Extract Fields & Normalize Candidate Strings
    extracted_fields = parse_pan_fields(all_raw_text)

    # Header Fuzzy Check
    header_found = check_header_fuzzy(all_raw_text)

    avg_confidence = (
        round(float(np.mean([f["confidence"] for f in extracted_fields.values() if f.get("value")])), 2)
        if extracted_fields else (0.85 if all_raw_text else 0.0)
    )

    return {
        "extractedFields": extracted_fields,
        "headerFound": header_found,
        "rawText": all_raw_text,
        "avgConfidence": avg_confidence,
        "ocrLines": extracted_lines
    }

def check_header_fuzzy(text: str) -> bool:
    if not text: return False
    text_upper = text.upper()
    for pattern in FUZZY_HEADER_PATTERNS:
        if re.search(pattern, text_upper):
            return True
    return False

def parse_pan_fields(text: str) -> dict:
    fields = {}
    if not text: return fields
    text_upper = text.upper()

    # 1. Exact PAN Pattern Search ([A-Z]{5}[0-9]{4}[A-Z]{1})
    exact_match = re.search(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b', text_upper)
    candidate_pan = None
    pan_confidence = 0.0

    if exact_match:
        candidate_pan = exact_match.group(0)
        pan_confidence = 0.98
    else:
        # Candidate 10-char block with position-aware OCR confusion correction
        # Format: 5 Letters + 4 Digits + 1 Letter
        words = re.findall(r'\b[A-Z0-9]{10}\b', text_upper)
        for w in words:
            corr = normalize_ocr_pan_candidate(w)
            if corr and re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', corr):
                candidate_pan = corr
                pan_confidence = 0.88
                break

    if candidate_pan:
        fields["documentNumber"] = {"value": candidate_pan, "confidence": pan_confidence}

    # 2. DOB Pattern Search (DD/MM/YYYY or DD-MM-YYYY)
    dob_match = re.search(r'\b(0[1-9]|[12][0-9]|3[01])[-/.](0[1-9]|1[012])[-/.](19|20)\d\d\b', text_upper)
    if dob_match:
        fields["dob"] = {"value": dob_match.group(0), "confidence": 0.95}

    # 3. Holder Name Search
    name_match = re.search(r'(?:NAME|HOLDER)[:\s]+([A-Z\s]{3,30})', text_upper)
    if name_match:
        c_name = name_match.group(1).strip()
        if len(c_name) > 2 and "FATHER" not in c_name and "INCOME" not in c_name:
            fields["name"] = {"value": c_name, "confidence": 0.90}

    # 4. Father's Name Search
    father_match = re.search(r'(?:FATHER|PARENT)[:\s]+([A-Z\s]{3,30})', text_upper)
    if father_match:
        c_father = father_match.group(1).strip()
        if len(c_father) > 2 and "INCOME" not in c_father:
            fields["fatherName"] = {"value": c_father, "confidence": 0.88}

    return fields

def normalize_ocr_pan_candidate(cand: str) -> str:
    """
    Position-aware OCR confusion correction:
    Index 0..4: Letters (O->0 invalid -> convert 0->O, 1->I, 5->S, 8->B, 2->Z)
    Index 5..8: Digits  (O->0, I->1, S->5, B->8, Z->2)
    Index 9   : Letter  (0->O, 1->I, 5->S, 8->B, 2->Z)
    """
    if len(cand) != 10: return None
    res = list(cand)

    num_to_let = {'0':'O', '1':'I', '5':'S', '8':'B', '2':'Z'}
    let_to_num = {'O':'0', 'I':'1', 'S':'5', 'B':'8', 'Z':'2'}

    # First 5 characters must be letters
    for i in range(5):
        if res[i].isdigit() and res[i] in num_to_let:
            res[i] = num_to_let[res[i]]

    # Middle 4 characters must be digits
    for i in range(5, 9):
        if res[i].isalpha() and res[i] in let_to_num:
            res[i] = let_to_num[res[i]]

    # Last character must be a letter
    if res[9].isdigit() and res[9] in num_to_let:
        res[9] = num_to_let[res[9]]

    return "".join(res)
