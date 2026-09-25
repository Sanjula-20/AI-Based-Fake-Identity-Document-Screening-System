import os
import json
import numpy as np
import cv2
from app.quality.checker import check_image_quality
from app.forensics.analyzer import analyze_image_forensics
from app.tampering.detector import predict_document_tampering

DATASET_TEST_DIR = "dataset/test"
RESULTS_DIR = "model_results"
METRICS_FILE = os.path.join(RESULTS_DIR, "metrics.json")

def evaluate_test_dataset() -> dict:
    """
    Evaluates pipeline tampering detection accuracy, precision, recall, F1, FPR, FNR,
    and confusion matrix across genuine vs manipulated test samples.
    """
    os.makedirs(RESULTS_DIR, exist_ok=True)

    if not os.path.exists(DATASET_TEST_DIR):
        print(f"Dataset directory '{DATASET_TEST_DIR}' not found. Generating default test samples...")
        try:
            from generate_test_dataset import build_dataset
            build_dataset(num_samples_per_class=10)
        except Exception as e:
            print(f"Could not generate dataset: {e}")

    y_true = []
    y_pred = []
    sample_reports = []

    # Classes: genuine -> 0, manipulated -> 1
    class_mapping = {"genuine": 0, "manipulated": 1}

    for class_name, true_label in class_mapping.items():
        cls_dir = os.path.join(DATASET_TEST_DIR, class_name)
        if not os.path.exists(cls_dir):
            continue

        for fname in os.listdir(cls_dir):
            if not fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue

            fpath = os.path.join(cls_dir, fname)
            with open(fpath, 'rb') as f:
                img_bytes = f.read()

            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            forensic = analyze_image_forensics(img)
            tampering = predict_document_tampering(img_bytes, forensic_result=forensic)

            predicted_label = 1 if tampering["prediction"] == "TAMPERED" else 0

            y_true.append(true_label)
            y_pred.append(predicted_label)

            sample_reports.append({
                "filename": fname,
                "actual": class_name.upper(),
                "predicted": tampering["prediction"],
                "genuineProbability": tampering["genuineProbability"],
                "tamperedProbability": tampering["tamperedProbability"]
            })

    if not y_true:
        fallback_metrics = {
            "evaluated": False,
            "message": "No test samples found in dataset/test directory."
        }
        with open(METRICS_FILE, 'w') as f:
            json.dump(fallback_metrics, f, indent=2)
        return fallback_metrics

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))

    total = len(y_true)
    accuracy = round((tp + tn) / total, 4) if total > 0 else 0.0
    precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
    recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
    f1_score = round(2 * precision * recall / (precision + recall), 4) if (precision + recall) > 0 else 0.0

    fpr = round(fp / (fp + tn), 4) if (fp + tn) > 0 else 0.0
    fnr = round(fn / (fn + tp), 4) if (fn + tp) > 0 else 0.0

    metrics = {
        "evaluated": True,
        "totalTestSamples": total,
        "confusionMatrix": {
            "truePositives": tp,
            "trueNegatives": tn,
            "falsePositives": fp,
            "falseNegatives": fn,
            "matrix": [[tn, fp], [fn, tp]]
        },
        "metrics": {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1Score": f1_score,
            "falsePositiveRate": fpr,
            "falseNegativeRate": fnr
        },
        "samplePredictions": sample_reports[:6]
    }

    with open(METRICS_FILE, 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"\n--- MODEL EVALUATION METRICS ---")
    print(f"Total Test Samples: {total}")
    print(f"Accuracy: {accuracy * 100:.2f}% | F1-Score: {f1_score:.4f}")
    print(f"Precision: {precision:.4f} | Recall: {recall:.4f}")
    print(f"FPR: {fpr:.4f} | FNR: {fnr:.4f}")
    print(f"Confusion Matrix [TN, FP / FN, TP]: [[{tn}, {fp}], [{fn}, {tp}]]\n")

    return metrics

if __name__ == "__main__":
    evaluate_test_dataset()
