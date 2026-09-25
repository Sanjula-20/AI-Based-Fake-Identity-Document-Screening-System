import cv2
import numpy as np

def verify_face_match(doc_img: np.ndarray, selfie_img: np.ndarray = None) -> dict:
    """
    Detects face bounding box on ID document and compares feature embeddings against optional selfie.
    Handles no face, multiple faces, and poor quality gracefully.
    """
    if selfie_img is None:
        return {
            "attempted": False,
            "similarityScore": 0.0,
            "matchStatus": "NOT_PROVIDED",
            "message": "Selfie was not uploaded for face matching."
        }

    try:
        # Load OpenCV Haar Cascade Face Detector
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

        gray_doc = cv2.cvtColor(doc_img, cv2.COLOR_BGR2GRAY) if len(doc_img.shape) == 3 else doc_img
        gray_selfie = cv2.cvtColor(selfie_img, cv2.COLOR_BGR2GRAY) if len(selfie_img.shape) == 3 else selfie_img

        faces_doc = face_cascade.detectMultiScale(gray_doc, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        faces_selfie = face_cascade.detectMultiScale(gray_selfie, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

        if len(faces_doc) == 0:
            return {
                "attempted": True,
                "similarityScore": 0.0,
                "matchStatus": "NO_FACE_IN_DOCUMENT",
                "message": "No clear facial portrait detected on the ID document."
            }

        if len(faces_selfie) == 0:
            return {
                "attempted": True,
                "similarityScore": 0.0,
                "matchStatus": "NO_FACE_IN_SELFIE",
                "message": "No facial portrait detected in the uploaded selfie."
            }

        # Crop primary faces
        dx, dy, dw, dh = faces_doc[0]
        sx, sy, sw, sh = faces_selfie[0]

        face_crop_doc = cv2.resize(gray_doc[dy:dy+dh, dx:dx+dw], (100, 100))
        face_crop_selfie = cv2.resize(gray_selfie[sy:sy+sh, sx:sx+sw], (100, 100))

        # Histogram Correlation Feature Vector Comparison
        hist_doc = cv2.calcHist([face_crop_doc], [0], None, [256], [0, 256])
        hist_selfie = cv2.calcHist([face_crop_selfie], [0], None, [256], [0, 256])

        cv2.normalize(hist_doc, hist_doc, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
        cv2.normalize(hist_selfie, hist_selfie, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)

        similarity = float(cv2.compareHist(hist_doc, hist_selfie, cv2.HISTCMP_CORREL))
        similarity_score = max(0.0, min(round(similarity, 2), 1.0))

        match_status = "MATCH" if similarity_score >= 0.65 else ("POSSIBLE_MATCH" if similarity_score >= 0.45 else "MISMATCH")

        return {
            "attempted": True,
            "similarityScore": similarity_score,
            "matchStatus": match_status,
            "docFaceLocation": [int(dx), int(dy), int(dw), int(dh)],
            "selfieFaceLocation": [int(sx), int(sy), int(sw), int(sh)]
        }
    except Exception as e:
        return {
            "attempted": True,
            "similarityScore": 0.0,
            "matchStatus": "ERROR",
            "message": f"Face verification error: {str(e)}"
        }
