import re
import cv2
import numpy as np

# Global PaddleOCR instance variable
paddle_ocr_instance = None

def get_paddle_ocr():
    global paddle_ocr_instance
    if paddle_ocr_instance is None:
        try:
            from paddleocr import PaddleOCR
            paddle_ocr_instance = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        except Exception as e:
            paddle_ocr_instance = False
    return paddle_ocr_instance

def extract_ocr_text_and_fields(img: np.ndarray, doc_type: str = "UNKNOWN") -> dict:
    """
    Performs OCR field extraction returning text, bounding boxes, and per-field confidence scores.
    Uses PaddleOCR when available with regex heuristic field parsing.
    """
    ocr_engine = get_paddle_ocr()
    extracted_lines = []
    
    if ocr_engine:
        try:
            result = ocr_engine.ocr(img, cls=True)
            if result and result[0]:
                for line in result[0]:
                    bbox = line[0]
                    text, confidence = line[1]
                    extracted_lines.append({
                        "text": text.strip(),
                        "confidence": round(float(confidence), 2),
                        "bbox": bbox
                    })
        except Exception as e:
            print(f"PaddleOCR Execution Error: {e}")

    raw_text = " ".join([line["text"] for line in extracted_lines]) if extracted_lines else ""
    
    # Regex Field Parser per Document Type
    extracted_fields = parse_fields_by_doc_type(raw_text, doc_type, extracted_lines)
    
    avg_confidence = (
        round(float(np.mean([field["confidence"] for field in extracted_fields.values() if field["value"]])), 2)
        if extracted_fields else (0.85 if raw_text else 0.0)
    )

    return {
        "extractedFields": extracted_fields,
        "rawText": raw_text,
        "avgConfidence": avg_confidence,
        "ocrLines": extracted_lines
    }

def parse_fields_by_doc_type(text: str, doc_type: str, lines: list) -> dict:
    fields = {}

    # 1. PAN Pattern: 5 letters, 4 numbers, 1 letter
    pan_match = re.search(r'[A-Z]{5}[0-9]{4}[A-Z]{1}', text)
    if pan_match:
        fields["documentNumber"] = {"value": pan_match.group(0), "confidence": 0.97}

    # 2. Aadhaar Pattern: 12 digits
    aadhaar_match = re.search(r'\b\d{4}\s?\d{4}\s?\d{4}\b', text)
    if aadhaar_match and doc_type == "AADHAAR":
        fields["documentNumber"] = {"value": aadhaar_match.group(0).replace(" ", ""), "confidence": 0.95}

    # 3. Passport Pattern: 1 letter followed by 7 digits
    passport_match = re.search(r'\b[A-Z][0-9]{7}\b', text)
    if passport_match:
        fields["documentNumber"] = {"value": passport_match.group(0), "confidence": 0.96}

    # 4. Driving License Pattern
    dl_match = re.search(r'\b[A-Z]{2}[0-9]{2}\s?[0-9]{11}\b|\b[A-Z]{2}-[0-9]{13}\b', text)
    if dl_match:
        fields["documentNumber"] = {"value": dl_match.group(0), "confidence": 0.94}

    # 5. Date of Birth Pattern
    dob_match = re.search(r'\b(0[1-9]|[12][0-9]|3[01])[-/.](0[1-9]|1[012])[-/.](19|20)\d\d\b', text)
    if dob_match:
        fields["dob"] = {"value": dob_match.group(0), "confidence": 0.90}

    # 6. Name Extraction heuristic
    name_match = re.search(r'(?:NAME|HOLDER|STUDENT|EMPLOYEE)[:\s]+([A-Z\s]{3,30})', text)
    if name_match:
        clean_name = name_match.group(1).strip()
        if len(clean_name) > 3:
            fields["name"] = {"value": clean_name, "confidence": 0.88}

    return fields
