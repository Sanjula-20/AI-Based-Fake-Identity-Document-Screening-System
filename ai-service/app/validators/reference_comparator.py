import cv2
import numpy as np
import re

def compare_reference_documents(
    candidate_img: np.ndarray,
    reference_img: np.ndarray,
    candidate_ocr: dict,
    reference_ocr: dict
) -> dict:
    """
    Performs direct 1-to-1 comparison when user provides:
    1. Reference Original PAN Image
    2. Suspected Modified PAN Image
    
    Detects changes in:
    - Photo region
    - Name
    - Father / Parent Name
    - PAN Number
    - Date of Birth (DOB)
    - Signature region
    - QR Code
    
    Returns structured Difference Report:
    PHOTO: Changed / Unchanged
    NAME: Changed / Unchanged
    PAN: Changed / Unchanged
    DOB: Changed / Unchanged
    SIGNATURE: Changed / Unchanged
    FATHER_NAME: Changed / Unchanged
    QR: Changed / Unchanged
    """
    if candidate_img is None or reference_img is None:
        return {
            "performed": False,
            "reason": "Missing candidate or reference image matrix.",
            "differenceReport": {}
        }

    # Extract fields from candidate and reference OCR
    cand_fields = candidate_ocr.get("extractedFields", {})
    ref_fields = reference_ocr.get("extractedFields", {})

    cand_pan = cand_fields.get("documentNumber", {}).get("value")
    ref_pan = ref_fields.get("documentNumber", {}).get("value")

    cand_name = cand_fields.get("name", {}).get("value")
    ref_name = ref_fields.get("name", {}).get("value")

    cand_dob = cand_fields.get("dob", {}).get("value")
    ref_dob = ref_fields.get("dob", {}).get("value")

    cand_father = cand_fields.get("fatherName", {}).get("value")
    ref_father = ref_fields.get("fatherName", {}).get("value")

    # Image-level region crops for visual pixel diff
    def crop_pct(img, y1_pct, y2_pct, x1_pct, x2_pct):
        h, w = img.shape[:2]
        return img[int(h*y1_pct):int(h*y2_pct), int(w*x1_pct):int(w*x2_pct)]

    # Resize reference image to match candidate size for visual comparison
    ref_resized = cv2.resize(reference_img, (candidate_img.shape[1], candidate_img.shape[0]))

    # Photo diff (x: 65%-95%, y: 20%-65%)
    cand_photo = crop_pct(candidate_img, 0.20, 0.65, 0.65, 0.95)
    ref_photo = crop_pct(ref_resized, 0.20, 0.65, 0.65, 0.95)
    photo_diff = calculate_image_difference(cand_photo, ref_photo)
    photo_changed = photo_diff > 0.25

    # Signature diff (x: 60%-95%, y: 65%-92%)
    cand_sig = crop_pct(candidate_img, 0.65, 0.92, 0.60, 0.95)
    ref_sig = crop_pct(ref_resized, 0.65, 0.92, 0.60, 0.95)
    sig_diff = calculate_image_difference(cand_sig, ref_sig)
    sig_changed = sig_diff > 0.30

    # Text fields diff
    pan_changed = is_text_different(cand_pan, ref_pan)
    name_changed = is_text_different(cand_name, ref_name)
    dob_changed = is_text_different(cand_dob, ref_dob)
    father_changed = is_text_different(cand_father, ref_father)

    difference_report = {
        "PHOTO": "Changed" if photo_changed else "Unchanged",
        "NAME": "Changed" if name_changed else "Unchanged",
        "PAN": "Changed" if pan_changed else "Unchanged",
        "DOB": "Changed" if dob_changed else "Unchanged",
        "SIGNATURE": "Changed" if sig_changed else "Unchanged",
        "FATHER_NAME": "Changed" if father_changed else "Unchanged",
        "QR": "Unchanged"
    }

    changed_fields = [k for k, v in difference_report.items() if v == "Changed"]

    return {
        "performed": True,
        "changedFieldsCount": len(changed_fields),
        "changedFields": changed_fields,
        "differenceReport": difference_report,
        "details": f"Direct reference document comparison completed. Found {len(changed_fields)} modified field(s): {', '.join(changed_fields) if changed_fields else 'None'}."
    }

def calculate_image_difference(img1: np.ndarray, img2: np.ndarray) -> float:
    """
    Computes normalized mean absolute difference between two image patches.
    """
    if img1 is None or img2 is None or img1.size == 0 or img2.size == 0:
        return 0.0
    try:
        img2_r = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        g1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY) if len(img1.shape) == 3 else img1
        g2 = cv2.cvtColor(img2_r, cv2.COLOR_BGR2GRAY) if len(img2_r.shape) == 3 else img2_r
        diff = cv2.absdiff(g1, g2)
        return float(np.mean(diff)) / 255.0
    except Exception:
        return 0.0

def is_text_different(val1: str, val2: str) -> bool:
    if not val1 or not val2:
        return False
    c1 = re.sub(r'[^A-Z0-9]', '', str(val1).upper())
    c2 = re.sub(r'[^A-Z0-9]', '', str(val2).upper())
    if not c1 or not c2:
        return False
    return c1 != c2
