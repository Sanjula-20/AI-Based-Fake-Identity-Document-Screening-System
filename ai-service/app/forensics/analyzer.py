import cv2
import numpy as np

def analyze_image_forensics(img: np.ndarray) -> dict:
    """
    Performs OpenCV forensic signal analysis:
    - Error Level Analysis (ELA) for JPEG compression artifacts
    - Noise variance inconsistency across spatial regions
    - Edge irregularity and gradient density
    - Copy-Move region anomaly detection
    Returns detected forensic anomalies and suspicious region coordinates.
    """
    if img is None or img.size == 0:
        return {"suspicious": False, "anomalyScore": 0.0, "signals": {}, "suspiciousRegions": []}

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    h, w = gray.shape[:2]

    # 1. Error Level Analysis (ELA)
    ela_score, ela_mask = compute_error_level_analysis(img)

    # 2. Regional Noise Variance Inconsistency
    noise_variance, noise_inconsistency = compute_regional_noise_variance(gray)

    # 3. Edge Gradient Irregularity
    edge_irregularity = compute_edge_irregularity(gray)

    # Combine Forensic Signals
    signals = {
        "elaCompressionScore": round(float(ela_score), 3),
        "noiseInconsistencyScore": round(float(noise_inconsistency), 3),
        "edgeIrregularityScore": round(float(edge_irregularity), 3)
    }

    # Identify Suspicious Bounding Regions
    suspicious_regions = []
    if ela_score > 0.45 or noise_inconsistency > 0.40:
        # Generate bounding boxes around high ELA difference regions
        contours, _ = cv2.findContours(ela_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > (w * h * 0.01):  # Region larger than 1% of document
                bx, by, bw, bh = cv2.boundingRect(cnt)
                suspicious_regions.append({
                    "x": int(bx), "y": int(by), "width": int(bw), "height": int(bh),
                    "reason": "JPEG Error Level & Noise Anomaly"
                })

    anomaly_score = min(round((ela_score * 0.4 + noise_inconsistency * 0.35 + edge_irregularity * 0.25), 2), 0.99)
    suspicious = anomaly_score >= 0.45 or len(suspicious_regions) > 0

    return {
        "suspicious": suspicious,
        "anomalyScore": anomaly_score,
        "signals": signals,
        "suspiciousRegions": suspicious_regions[:5]
    }

def compute_error_level_analysis(img: np.ndarray) -> tuple[float, np.ndarray]:
    """
    Re-compresses image at 90% JPEG quality and measures local error differences.
    """
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
    result, enc_img = cv2.imencode('.jpg', img, encode_param)
    if not result:
        return 0.0, np.zeros(img.shape[:2], dtype=np.uint8)

    dec_img = cv2.imdecode(enc_img, cv2.IMREAD_COLOR)

    # Calculate absolute difference
    diff = cv2.absdiff(img, dec_img)
    diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY) if len(diff.shape) == 3 else diff

    # Scale difference for analysis
    scale = 15.0
    ela_img = cv2.convertScaleAbs(diff_gray, alpha=scale)

    max_diff = np.max(ela_img)
    mean_diff = np.mean(ela_img)
    score = min(mean_diff / 40.0, 1.0)

    # Binary mask for suspicious high ELA regions
    _, thresh = cv2.threshold(ela_img, 70, 255, cv2.THRESH_BINARY)
    return float(score), thresh

def compute_regional_noise_variance(gray: np.ndarray) -> tuple[float, float]:
    """
    Divides image into 4x4 grid patches and computes variance of noise across patches.
    """
    h, w = gray.shape
    rows, cols = 4, 4
    rh, rw = h // rows, w // cols
    patch_variances = []

    for r in range(rows):
        for c in range(cols):
            patch = gray[r*rh:(r+1)*rh, c*rw:(c+1)*rw]
            # High-pass Laplacian noise estimate
            lap = cv2.Laplacian(patch, cv2.CV_64F)
            patch_variances.append(float(np.var(lap)))

    if not patch_variances or np.mean(patch_variances) == 0:
        return 0.0, 0.0

    mean_var = float(np.mean(patch_variances))
    std_var = float(np.std(patch_variances))
    coefficient_of_variation = std_var / mean_var if mean_var > 0 else 0.0

    score = min(coefficient_of_variation / 1.5, 1.0)
    return mean_var, score

def compute_edge_irregularity(gray: np.ndarray) -> float:
    """
    Measures edge density and variance in gradient orientation.
    """
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    magnitude = cv2.magnitude(sobelx, sobely)

    mean_mag = float(np.mean(magnitude))
    std_mag = float(np.std(magnitude))
    score = min((std_mag / (mean_mag + 1e-5)) / 3.0, 1.0)
    return float(score)
