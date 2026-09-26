import cv2
import numpy as np
from PIL import Image
from PIL.ExifTags import TAGS
import io

def analyze_synthetic_image(img: np.ndarray, raw_bytes: bytes = None) -> dict:
    """
    Analyzes document image for AI-generation / synthetic / compositing indicators:
    - Fourier Transform (FFT) high-frequency spectral grid artifacts
    - Unnatural background texture & micro-print pattern degradation
    - Inconsistent text stroke rendering & typography variance
    - Metadata analysis (EXIF editing software signatures)
    """
    if img is None or img.size == 0:
        return {
            "isSynthetic": False,
            "syntheticScore": 0,
            "evidence": [],
            "warnings": ["Image empty for synthetic analysis."]
        }

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

    evidence = []
    warnings = []
    scores = []

    # 1. Fourier Spectral Energy Artifacts (FFT Analysis)
    fft_score, fft_has_artifacts = check_fft_spectral_artifacts(gray)
    scores.append(fft_score)
    if fft_has_artifacts:
        warnings.append("✗ Spectral analysis detected high-frequency periodic grid patterns typical of AI generation")
    else:
        evidence.append("✓ Frequency spectrum matches optical camera / document scanner acquisition")

    # 2. Text Stroke Rendering & Contour Uniformity
    text_score, text_unnatural = check_text_rendering_naturalness(gray)
    scores.append(text_score)
    if text_unnatural:
        warnings.append("✗ Unnatural character contour blurred rendering or stroke shape inconsistency detected")
    else:
        evidence.append("✓ Character stroke contours exhibit sharp optical printing edges")

    # 3. Background Security Pattern & Micro-Print Texture
    bg_score, bg_degraded = check_background_texture_naturalness(gray)
    scores.append(bg_score)
    if bg_degraded:
        warnings.append("✗ Document background security pattern exhibits unnatural smoothing or loss of micro-texture")
    else:
        evidence.append("✓ Background guilloche and micro-pattern texture distribution is natural")

    # 4. EXIF Metadata Software Analysis (if bytes provided)
    exif_score, metadata_warning, metadata_evidence = check_exif_metadata(raw_bytes)
    if exif_score > 0:
        scores.append(exif_score)
    if metadata_warning:
        warnings.append(metadata_warning)
    if metadata_evidence:
        evidence.append(metadata_evidence)

    # Dynamic Synthetic Score (0 to 100)
    synthetic_score_100 = int(round(float(np.mean(scores)) * 100.0))
    is_synthetic = synthetic_score_100 >= 55 or (fft_has_artifacts and bg_degraded)

    if not is_synthetic and synthetic_score_100 < 35:
        evidence.append("✓ No significant synthetic image or generative AI artifacts detected")

    return {
        "isSynthetic": is_synthetic,
        "syntheticScore": synthetic_score_100,
        "signals": {
            "fftScore": round(float(fft_score), 2),
            "textNaturalnessScore": round(float(1.0 - text_score), 2),
            "bgTextureScore": round(float(1.0 - bg_score), 2),
            "exifAnomalyScore": round(float(exif_score), 2)
        },
        "evidence": evidence,
        "warnings": warnings
    }

def check_fft_spectral_artifacts(gray: np.ndarray) -> tuple[float, bool]:
    """
    Computes Fast Fourier Transform magnitude spectrum to detect periodic grid artifacts from AI upsamplers.
    """
    try:
        # Resize to standard size for consistent FFT spectral analysis
        resized = cv2.resize(gray, (512, 512))
        f = np.fft.fft2(resized)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-5)

        # Mask out center DC component
        ch, cw = 256, 256
        magnitude_spectrum[ch-15:ch+15, cw-15:cw+15] = 0

        # Calculate high-frequency energy ratio and max peak ratio
        high_freq_mean = float(np.mean(magnitude_spectrum))
        high_freq_max = float(np.max(magnitude_spectrum))
        peak_ratio = high_freq_max / (high_freq_mean + 1e-5)

        # Generative AI artifacts produce sharp isolated peaks in high frequency space
        has_artifacts = peak_ratio > 3.8 and high_freq_max > 180.0
        score = min(max((peak_ratio - 2.0) / 3.0, 0.0), 1.0)
        return float(score), has_artifacts
    except Exception:
        return 0.0, False

def check_text_rendering_naturalness(gray: np.ndarray) -> tuple[float, bool]:
    """
    Measures character boundary sharpness and stroke edge variance.
    AI generated documents often produce fuzzy text boundaries or uneven character shapes.
    """
    try:
        # Sobel gradient magnitude
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        grad_mag = cv2.magnitude(sobelx, sobely)

        # Otsu thresholding to find text pixels
        _, text_mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        if np.sum(text_mask) == 0:
            return 0.0, False

        text_grad = grad_mag[text_mask > 0]
        mean_grad = float(np.mean(text_grad)) if text_grad.size > 0 else 0.0
        std_grad = float(np.std(text_grad)) if text_grad.size > 0 else 0.0

        # Low mean gradient on text pixels with high variance indicates blurry/unnatural character edges
        edge_blurriness = std_grad / (mean_grad + 1e-5) if mean_grad > 0 else 0.0
        unnatural = edge_blurriness > 2.8 and mean_grad < 25.0
        score = min(max((edge_blurriness - 1.5) / 2.0, 0.0), 1.0)
        return float(score), unnatural
    except Exception:
        return 0.0, False

def check_background_texture_naturalness(gray: np.ndarray) -> tuple[float, bool]:
    """
    Measures spatial texture regularity in non-text background regions.
    """
    try:
        # Otsu thresholding to find background pixels
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        bg_mask = thresh > 0

        if np.sum(bg_mask) == 0:
            return 0.0, False

        # Compute Local Binary Pattern (LBP) or local variance on background
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        bg_lap = lap[bg_mask]

        var_bg = float(np.var(bg_lap)) if bg_lap.size > 0 else 0.0

        # Extremely low background variance (< 10) indicates synthetic flat vector rendering;
        # Extremely high irregular variance (> 2500) indicates synthetic noise injection.
        degraded = var_bg < 8.0 or var_bg > 3200.0
        score = 0.6 if degraded else 0.05
        return float(score), degraded
    except Exception:
        return 0.0, False

def check_exif_metadata(raw_bytes: bytes = None) -> tuple[float, str, str]:
    """
    Inspects EXIF metadata for image editing software traces.
    """
    if not raw_bytes:
        return 0.0, None, None

    try:
        image = Image.open(io.BytesIO(raw_bytes))
        exif = image._getexif()

        if not exif:
            return 0.0, None, None

        software_found = None
        suspicious_keywords = [
            "photoshop", "gimp", "canva", "midjourney", "stable diffusion",
            "dall-e", "paint.net", "inkscape", "illustrator", "editor"
        ]

        for tag_id, value in exif.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag in ["Software", "ProcessingSoftware", "ImageDescription", "UserComment"]:
                val_str = str(value).lower()
                for kw in suspicious_keywords:
                    if kw in val_str:
                        software_found = str(value).strip()
                        break

        if software_found:
            warning = f"✗ Metadata analysis detected image editing software signature ('{software_found}')"
            return 0.7, warning, None

        evidence = "✓ EXIF metadata contains no digital editing software signatures"
        return 0.0, None, evidence
    except Exception:
        return 0.0, None, None
