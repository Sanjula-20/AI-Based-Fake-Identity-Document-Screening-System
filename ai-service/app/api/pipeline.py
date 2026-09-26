from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import cv2
import numpy as np

from app.quality.checker import check_image_quality
from app.quality.preprocessor import preprocess_document_image
from app.classifiers.classifier import classify_document
from app.ocr.engine import extract_ocr_text_and_fields
from app.validators.pan_validator import validate_pan_document
from app.forensics.analyzer import analyze_image_forensics
from app.forensics.synthetic import analyze_synthetic_image
from app.forensics.photo_analyzer import analyze_photo_region
from app.forensics.signature_analyzer import analyze_signature_region
from app.forensics.text_tampering import analyze_text_tampering
from app.tampering.detector import predict_document_tampering
from app.mrz_qr.decoder import decode_qr_and_barcode
from app.risk_engine.consistency import evaluate_field_consistency
from app.official.verifier import perform_official_pan_verification
from app.validators.reference_comparator import compare_reference_documents
from app.face.verifier import verify_face_match
from app.liveness.detector import check_liveness_status
from app.risk_engine.engine import calculate_fraud_risk

router = APIRouter()

@router.post("/analyze")
async def analyze_document_pipeline(
    document: UploadFile = File(...),
    referenceDocument: Optional[UploadFile] = File(None),
    selfie: Optional[UploadFile] = File(None),
    selectedType: Optional[str] = Form("PAN")
):
    try:
        doc_bytes = await document.read()
        ref_bytes = await referenceDocument.read() if referenceDocument else None
        selfie_bytes = await selfie.read() if selfie else None

        # 1. Image Quality Check
        quality_result = check_image_quality(doc_bytes)

        # 2. Multi-Stage Image Preprocessing (original, grayscale, contrast enhanced, sharpened, perspective corrected)
        original_img, variants = preprocess_document_image(doc_bytes)
        is_recompressed = quality_result.get("isRecompressed", False)

        # 3. OCR Across Multi-Stage Image Variants
        ocr_result = extract_ocr_text_and_fields(original_img, doc_type="PAN", variants=variants)
        raw_text = ocr_result.get("rawText", "")
        ocr_lines = ocr_result.get("ocrLines", [])
        header_found = ocr_result.get("headerFound", True)

        # 4. Document Scope Classifier
        classifier_result = classify_document(raw_text, original_img.shape, selected_hint="PAN")
        
        if not classifier_result.get("isPanCard", True):
            return {
                "documentType": "NON_PAN_DOCUMENT",
                "decision": "UNVERIFIABLE",
                "verdict": "NON-PAN DOCUMENT UPLOADED",
                "riskScore": 75,
                "riskStatus": "UNVERIFIABLE",
                "confidence": 0,
                "reasons": ["Uploaded document is not a recognized Indian PAN Card."],
                "fieldResults": {},
                "warnings": ["Uploaded document is not a recognized Indian PAN Card."]
            }

        # 5. PAN Document Structure & Format Validator
        format_result = validate_pan_document(
            ocr_result.get("extractedFields", {}), raw_text, ocr_lines=ocr_lines, header_found=header_found
        )

        # 6. Photo Replacement & Tampering Detector
        photo_result = analyze_photo_region(original_img, is_recompressed=is_recompressed, ocr_lines=ocr_lines)

        # 7. Signature Tampering Detector
        signature_result = analyze_signature_region(original_img, is_recompressed=is_recompressed)

        # 8. Text Field Tampering Detector
        text_tampering_result = analyze_text_tampering(original_img, ocr_lines=ocr_lines, is_recompressed=is_recompressed)

        # 9. OpenCV Multi-Signal Image Forensics
        forensic_result = analyze_image_forensics(original_img, is_recompressed=is_recompressed, raw_bytes=doc_bytes)

        # 10. AI Synthetic / Generative Image Analysis
        synthetic_result = analyze_synthetic_image(original_img, raw_bytes=doc_bytes)

        # 11. PyTorch ResNet Model Prediction
        tampering_result = predict_document_tampering(
            doc_bytes,
            forensic_result=forensic_result,
            synthetic_result=synthetic_result,
            format_result=format_result
        )

        # 12. QR Code Decoder & Payload Inspector
        qr_result = decode_qr_and_barcode(original_img)

        # 13. Cross-Field Consistency Engine
        consistency_result = evaluate_field_consistency(
            ocr_result.get("extractedFields", {}),
            qr_result,
            mrz_data={"detected": False},
            format_result=format_result
        )

        # 14. Authoritative Official Verification Layer
        extracted_pan = format_result.get("rawPanNumber")
        extracted_name = ocr_result.get("extractedFields", {}).get("name", {}).get("value")
        extracted_dob = ocr_result.get("extractedFields", {}).get("dob", {}).get("value")
        official_verification = perform_official_pan_verification(extracted_pan, extracted_name, extracted_dob)

        # 15. Reference Image Direct Comparison (if provided)
        reference_comparison = {"performed": False, "differenceReport": {}}
        if ref_bytes:
            nparr_ref = np.frombuffer(ref_bytes, np.uint8)
            ref_img = cv2.imdecode(nparr_ref, cv2.IMREAD_COLOR)
            ref_ocr = extract_ocr_text_and_fields(ref_img, doc_type="PAN")
            reference_comparison = compare_reference_documents(original_img, ref_img, ocr_result, ref_ocr)

        # 16. Face Verification (if selfie provided)
        selfie_img = None
        if selfie_bytes:
            nparr = np.frombuffer(selfie_bytes, np.uint8)
            selfie_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        face_result = verify_face_match(original_img, selfie_img)
        liveness_result = check_liveness_status(has_selfie=bool(selfie_bytes))

        # 17. Dynamic Evidence-Based Risk Engine Decision
        risk_output = calculate_fraud_risk(
            quality_result=quality_result,
            ocr_result=ocr_result,
            format_result=format_result,
            tampering_result=tampering_result,
            forensic_result=forensic_result,
            qr_result=qr_result,
            mrz_result={"detected": False},
            consistency_result=consistency_result,
            face_result=face_result,
            liveness_result=liveness_result,
            synthetic_result=synthetic_result,
            photo_result=photo_result,
            signature_result=signature_result,
            text_tampering_result=text_tampering_result,
            official_verification=official_verification,
            reference_comparison=reference_comparison
        )

        return {
            "documentType": "PAN",
            "decision": risk_output["decision"],
            "classification": risk_output["classification"],
            "isCorrect": risk_output["isCorrect"],
            "verdict": risk_output.get("verdict", "NO OBVIOUS TAMPERING DETECTED"),
            "basisOfClassification": risk_output["basisOfClassification"],
            "riskScore": risk_output["riskScore"],
            "riskStatus": risk_output["riskStatus"],
            "confidence": risk_output["confidence"],
            "fieldResults": risk_output["fieldResults"],
            "signals": risk_output["signals"],
            "evidence": risk_output["evidence"],
            "warnings": risk_output["warnings"],
            "documentTypeConfidence": classifier_result["confidence"],
            "imageQuality": quality_result,
            "ocrResult": ocr_result,
            "formatValidation": format_result,
            "tampering": {
                **tampering_result,
                "forensicSignals": forensic_result["signals"],
                "suspiciousRegions": forensic_result.get("suspiciousRegions", [])
            },
            "qrAnalysis": qr_result,
            "fieldConsistency": consistency_result,
            "faceVerification": face_result,
            "liveness": liveness_result,
            "reasons": risk_output["reasons"],
            "individualChecks": risk_output["individualChecks"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PAN Pipeline Processing Error: {str(e)}")

@router.post("/compare")
async def compare_pan_documents(
    candidateDocument: UploadFile = File(...),
    referenceDocument: UploadFile = File(...)
):
    try:
        cand_bytes = await candidateDocument.read()
        ref_bytes = await referenceDocument.read()

        nparr_c = np.frombuffer(cand_bytes, np.uint8)
        cand_img = cv2.imdecode(nparr_c, cv2.IMREAD_COLOR)

        nparr_r = np.frombuffer(ref_bytes, np.uint8)
        ref_img = cv2.imdecode(nparr_r, cv2.IMREAD_COLOR)

        cand_ocr = extract_ocr_text_and_fields(cand_img, doc_type="PAN")
        ref_ocr = extract_ocr_text_and_fields(ref_img, doc_type="PAN")

        comp_result = compare_reference_documents(cand_img, ref_img, cand_ocr, ref_ocr)
        return comp_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PAN Document Comparison Error: {str(e)}")
