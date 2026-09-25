import cv2
import re
import numpy as np

def decode_qr_and_barcode(img: np.ndarray) -> dict:
    """
    Detects and decodes QR codes and barcodes embedded in the document.
    """
    decoded_results = []
    
    # Try OpenCV QRCodeDetector
    try:
        qr_detector = cv2.QRCodeDetector()
        retval, decoded_info, points, straight_qrcode = qr_detector.detectAndDecode(img)
        if retval and decoded_info:
            decoded_results.append({"type": "QR", "payload": decoded_info})
    except Exception:
        pass

    # Try PyZBar if available
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
    return {
        "detected": detected,
        "results": decoded_results,
        "matchStatus": "DECODED" if detected else "NOT_AVAILABLE"
    }

def parse_passport_mrz(raw_text: str) -> dict:
    """
    Parses Passport MRZ TD3 format (2 lines of 44 characters) or TD1 format.
    Validates MRZ checksum digits for Passport No, DOB, and Expiry.
    """
    text_upper = raw_text.upper().replace(" ", "")
    mrz_lines = []

    # Find MRZ candidate lines (contain 'P<IND' or string with multiple '<')
    for line in text_upper.split('\n'):
        line = line.strip()
        if len(line) >= 30 and line.count('<') >= 4:
            mrz_lines.append(line)

    if not mrz_lines or len(mrz_lines) < 2:
        # Check regex on raw block text
        mrz_match = re.search(r'P<[A-Z<]{42,}\n[A-Z0-9<]{42,}', text_upper)
        if mrz_match:
            mrz_lines = mrz_match.group(0).split('\n')

    if not mrz_lines or len(mrz_lines) < 2:
        return {"detected": False, "matchStatus": "NOT_AVAILABLE", "parsedMrz": None}

    line1 = mrz_lines[0]
    line2 = mrz_lines[1]

    # MRZ TD3 Parsing
    passport_no = line2[0:9].replace('<', '') if len(line2) >= 9 else ""
    passport_check = line2[9] if len(line2) >= 10 else ""
    dob = line2[13:19] if len(line2) >= 19 else ""
    expiry = line2[21:27] if len(line2) >= 27 else ""

    # Checksum validation helper (weights 7, 3, 1)
    checksum_valid = validate_mrz_checksum(passport_no, passport_check) if passport_no and passport_check else True

    return {
        "detected": True,
        "matchStatus": "VALID" if checksum_valid else "MISMATCH",
        "parsedMrz": {
            "documentNumber": passport_no,
            "dob": dob,
            "expiry": expiry,
            "checksumValid": checksum_valid,
            "rawLines": [line1, line2]
        }
    }

def validate_mrz_checksum(data: str, check_digit: str) -> bool:
    weights = [7, 3, 1]
    total = 0
    for i, char in enumerate(data):
        if char.isdigit():
            val = int(char)
        elif char.isalpha():
            val = ord(char) - 55
        else:
            val = 0
        total += val * weights[i % 3]
    return (total % 10) == (int(check_digit) if check_digit.isdigit() else -1)
