import cv2
import re
import numpy as np

def decode_qr_and_barcode(img: np.ndarray) -> dict:
    """
    Detects and decodes QR codes embedded in Indian PAN cards.
    Extracts encoded PAN, Name, DOB, Father's Name, and Photo/Signature payload where available.
    
    IMPORTANT:
    If QR code is missing (older PAN design), returns matchStatus="NOT_PRESENT"
    without penalizing the card as fraudulent.
    If QR decoding fails due to blur/crop/damage, returns matchStatus="UNREADABLE".
    """
    if img is None or img.size == 0:
        return {
            "detected": False,
            "matchStatus": "UNREADABLE",
            "reason": "QR verification unavailable.",
            "results": [],
            "parsedQr": None
        }

    decoded_results = []
    
    # 1. Try OpenCV QRCodeDetector
    try:
        qr_detector = cv2.QRCodeDetector()
        retval, decoded_info, points, straight_qrcode = qr_detector.detectAndDecode(img)
        if retval and decoded_info:
            decoded_results.append({"type": "QR", "payload": decoded_info})
    except Exception:
        pass

    # 2. Try PyZBar if available
    try:
        from pyzbar.pyzbar import decode
        barcodes = decode(img)
        for barcode in barcodes:
            payload = barcode.data.decode("utf-8", errors="ignore")
            b_type = barcode.type
            if not any(r["payload"] == payload for r in decoded_results):
                decoded_results.append({"type": b_type, "payload": payload})
    except Exception:
        pass

    detected = len(decoded_results) > 0

    if not detected:
        # Check if QR box is visually present but unreadable due to blur/damage
        h, w = img.shape[:2]
        qr_region = img[int(h*0.5):int(h*0.95), int(w*0.5):int(w*0.95)]
        lap_var = float(np.var(cv2.Laplacian(cv2.cvtColor(qr_region, cv2.COLOR_BGR2GRAY), cv2.CV_64F))) if qr_region.size > 0 else 0
        
        if lap_var < 50.0:
            return {
                "detected": False,
                "matchStatus": "UNREADABLE",
                "reason": "QR verification unavailable.",
                "results": [],
                "parsedQr": None
            }
        else:
            return {
                "detected": False,
                "matchStatus": "NOT_PRESENT",
                "reason": "QR code not present on document (Standard for older PAN card designs).",
                "results": [],
                "parsedQr": None
            }

    raw_payload = decoded_results[0]["payload"]
    parsed_qr = parse_pan_qr_payload(raw_payload)

    return {
        "detected": True,
        "matchStatus": "DECODED",
        "reason": "QR code detected and successfully decoded.",
        "results": decoded_results,
        "parsedQr": parsed_qr
    }

def parse_pan_qr_payload(payload: str) -> dict:
    """
    Parses NSDL/UTIITSL PAN QR payloads (plain text, JSON, XML, or delimited string).
    """
    if not payload:
        return {}

    parsed = {}
    
    # Check 10-char PAN regex inside QR payload
    pan_match = re.search(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b', payload.upper())
    if pan_match:
        parsed["panNumber"] = pan_match.group(0)

    # Check DOB regex inside QR payload
    dob_match = re.search(r'\b\d{2}[-/. ]\d{2}[-/. ]\d{4}\b', payload)
    if dob_match:
        parsed["dob"] = dob_match.group(0)

    # Name extraction heuristic from pipe-delimited payload (e.g., PAN|NAME|FATHER_NAME|DOB)
    if '|' in payload:
        parts = [p.strip() for p in payload.split('|') if p.strip()]
        for p in parts:
            if re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', p.upper()):
                parsed["panNumber"] = p.upper()
            elif re.match(r'^\d{2}[-/. ]\d{2}[-/. ]\d{4}$', p):
                parsed["dob"] = p
            elif len(p) > 3 and not re.search(r'\d', p) and "pan" not in p.lower():
                if "name" not in parsed:
                    parsed["name"] = p
                elif "fatherName" not in parsed:
                    parsed["fatherName"] = p

    return parsed

def parse_passport_mrz(raw_text: str) -> dict:
    return {"detected": False, "matchStatus": "NOT_AVAILABLE", "parsedMrz": None}
