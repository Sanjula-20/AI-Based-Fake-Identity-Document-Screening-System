from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import cv2
import numpy as np

from app.quality.checker import check_image_quality
from app.quality.preprocessor import preprocess_document_image
from app.classifiers.classifier import classify_document
from app.ocr.engine import extract_ocr_text_and_fields
from app.validators.pan_validator import validate_pan_document
from app.validators.passport_validator import validate_passport_document
from app.validators.aadhaar_validator import validate_aadhaar_document
from app.validators.driving_license_validator import validate_dl_document
from app.validators.id_cards_validator import validate_id_card_document
from app.forensics.analyzer import analyze_image_forensics
from app.tampering.detector import predict_document_tampering
from app.mrz_qr.decoder import decode_qr_and_barcode, parse_passport_mrz
from app.risk_engine.consistency import evaluate_field_consistency
from app.face.verifier import verify_face_match
from app.liveness.detector import check_liveness_status
from app.risk_engine.engine import calculate_fraud_risk

router = APIRouter()

@router.post("/analyze")
async def analyze_document_pipeline(
    document: UploadFile = File(...),
    selfie: Optional[UploadFile] = File(None),
    selectedType: Optional[str] = Form(None)
):
    try:
        doc_bytes = await document.read()
        selfie_bytes = await selfie.read() if selfie else None

        # 1. Image Quality Check
        quality_result = check_image_quality(doc_bytes)
        if not quality_result.get("usable"):
            return {
                "documentType": selectedType or "UNKNOWN",
                "documentTypeConfidence": 0.0,
                "imageQuality": quality_result,
                "ocrResult": {"extractedFields": {}, "rawText": "", "avgConfidence": 0.0},
                "formatValidation": {"isValid": False, "issues": ["Document image unusable"]},
                "tampering": {"prediction": "UNABLE_TO_DETERMINE", "genuineProbability": 0.5, "tamperedProbability": 0.5},
                "qrAnalysis": {"detected": False, "matchStatus": "NOT_AVAILABLE"},
                "mrzAnalysis": {"detected": False, "matchStatus": "NOT_AVAILABLE"},
                "fieldConsistency": {"status": "UNKNOWN", "details": []},
                "faceVerification": {"attempted": False, "similarityScore": 0.0, "matchStatus": "NOT_AVAILABLE"},
                "liveness": {"status": "NOT_AVAILABLE", "details": "Unusable image"},
                "riskScore": 85,
                "riskStatus": "UNABLE_TO_DETERMINE",
                "confidence": 0.0,
                "reasons": ["Unable to reliably analyze document. Please upload a clearer image."],
                "individualChecks": {"quality": "FAIL"}
            }

        # 2. Image Preprocessing
        original_img, enhanced_gray = preprocess_document_image(doc_bytes)

        # 3. OCR & Field Extraction
        ocr_result = extract_ocr_text_and_fields(original_img, doc_type=selectedType or "UNKNOWN")
        raw_text = ocr_result.get("rawText", "")

        # 4. Document Type Classifier
        classifier_result = classify_document(raw_text, original_img.shape, selected_hint=selectedType)
        doc_type = classifier_result["documentType"]

        # 5. Document Format Validator
        if doc_type == "PAN":
            format_result = validate_pan_document(ocr_result["extractedFields"], raw_text)
        elif doc_type == "PASSPORT":
            format_result = validate_passport_document(ocr_result["extractedFields"], raw_text)
        elif doc_type == "AADHAAR":
            format_result = validate_aadhaar_document(ocr_result["extractedFields"], raw_text)
        elif doc_type == "DRIVING_LICENSE":
            format_result = validate_dl_document(ocr_result["extractedFields"], raw_text)
        elif doc_type in ["COLLEGE_ID", "EMPLOYEE_ID"]:
            format_result = validate_id_card_document(ocr_result["extractedFields"], raw_text, doc_type=doc_type)
        else:
            format_result = {"isValid": True, "documentType": doc_type, "issues": []}

        # 6. OpenCV Forensic Signal Analysis
        forensic_result = analyze_image_forensics(original_img)

        # 7. PyTorch ResNet Deep Learning Tampering Detector
        tampering_result = predict_document_tampering(doc_bytes, forensic_result=forensic_result)

        # 8. QR / Barcode & MRZ Decoder
        qr_result = decode_qr_and_barcode(original_img)
        mrz_result = parse_passport_mrz(raw_text)

        # 9. Field Consistency Engine
        consistency_result = evaluate_field_consistency(ocr_result["extractedFields"], qr_result, mrz_result)

        # 10. Face Verification (if selfie provided)
        selfie_img = None
        if selfie_bytes:
            nparr = np.frombuffer(selfie_bytes, np.uint8)
            selfie_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        face_result = verify_face_match(original_img, selfie_img)

        # 11. Liveness Status
        liveness_result = check_liveness_status(has_selfie=bool(selfie_bytes))

        # 12. Fraud Risk Engine Decision
        risk_output = calculate_fraud_risk(
            quality_result,
            ocr_result,
            format_result,
            tampering_result,
            forensic_result,
            qr_result,
            mrz_result,
            consistency_result,
            face_result,
            liveness_result
        )

        return {
            "documentType": doc_type,
            "documentTypeConfidence": classifier_result["confidence"],
            "imageQuality": quality_result,
            "ocrResult": ocr_result,
            "formatValidation": format_result,
            "tampering": {
                **tampering_result,
                "forensicSignals": forensic_result["signals"],
                "suspiciousRegions": forensic_result["suspiciousRegions"]
            },
            "qrAnalysis": qr_result,
            "mrzAnalysis": mrz_result,
            "fieldConsistency": consistency_result,
            "faceVerification": face_result,
            "liveness": liveness_result,
            "riskScore": risk_output["riskScore"],
            "riskStatus": risk_output["status"],
            "confidence": risk_output["confidence"],
            "reasons": risk_output["reasons"],
            "individualChecks": risk_output["individualChecks"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline Processing Error: {str(e)}")
