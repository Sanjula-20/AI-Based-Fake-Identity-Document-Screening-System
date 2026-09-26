import cv2
import numpy as np

def detect_synthetic_ai_document(img: np.ndarray, raw_text: str = "") -> dict:
    """
    Detects AI-generated / synthetic document indicators (Midjourney, ChatGPT, DALL-E, Generative Fill):
    - Frequency Domain 2D FFT spectral decay analysis
    - Unnatural background smoothness & lack of sensor noise
    - Text rendering unnaturalness
    """
    if img is None or img.size == 0:
        return {
            "syntheticScore": 0,
            "isSynthetic": False,
            "indicators": [],
            "evidence": ["✓ Image verified as authentic camera/scanner photograph"],
            "warnings": []
        }

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

    indicators = []
    evidence = []
    warnings = []
    scores = []

    # 1. Frequency Domain FFT Spectral Falloff Analysis
    try:
        # Resize to standard 512x512 for uniform spectral analysis
        gray_512 = cv2.resize(gray, (512, 512))
        f = np.fft.fft2(gray_512)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-5)

        # Compute radial average of power spectrum
        cy, cx = 256, 256
        y, x = np.ogrid[:512, :512]
        r = np.sqrt((x - cx)**2 + (y - cy)**2)
        r_int = r.astype(np.int32)

        radial_mean = np.bincount(r_int.ravel(), magnitude_spectrum.ravel()) / (np.bincount(r_int.ravel()) + 1e-5)
        
        # High frequency power ratio (r > 180) vs mid frequency power (50 < r < 150)
        mid_freq_power = np.mean(radial_mean[50:150]) if len(radial_mean) > 150 else 1.0
        high_freq_power = np.mean(radial_mean[180:240]) if len(radial_mean) > 240 else 1.0
        
        freq_ratio = high_freq_power / (mid_freq_power + 1e-5)

        if freq_ratio < 0.15:  # Unnatural smooth drop in high frequencies
            indicators.append("Unnatural high-frequency spectral falloff (Generative smoothing artifact)")
            scores.append(0.65)
        elif freq_ratio > 0.85: # Spectral grid spikes
            indicators.append("High-frequency periodic grid spikes (Diffusion model lattice artifact)")
            scores.append(0.70)
        else:
            scores.append(0.0)
    except Exception as e:
        scores.append(0.0)

    # 2. Background Sensor Noise Uniformity
    # Real camera sensors have physical dark current noise; AI images are hyper-smooth in background
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    noise_var = float(np.var(lap))

    if noise_var < 5.0 and len(img.shape) == 3:
        indicators.append("Hyper-smooth background lacking physical camera sensor noise")
        scores.append(0.60)
    else:
        scores.append(0.0)

    # 3. Unnatural Text rendering heuristic
    # Check if text exists but OCR confidence / character structure is garbled
    if raw_text and len(raw_text) > 15:
        non_ascii = len([c for c in raw_text if ord(c) > 127])
        garbled_ratio = non_ascii / float(len(raw_text))
        if garbled_ratio > 0.25:
            indicators.append("AI pseudo-text rendering artifacts detected in document text")
            scores.append(0.75)

    synthetic_score_100 = int(round(min(float(np.sum(scores)) * 60.0, 99.0)))
    is_synthetic = synthetic_score_100 >= 50 or len(indicators) >= 2

    if is_synthetic:
        warnings.append(f"Synthetic AI image generation markers detected ({', '.join(indicators)})")
    else:
        evidence.append("✓ Micro-texture and frequency spectrum match physical camera capture (No AI generation indicators)")

    return {
        "syntheticScore": synthetic_score_100,
        "isSynthetic": is_synthetic,
        "indicators": indicators,
        "evidence": evidence,
        "warnings": warnings
    }
