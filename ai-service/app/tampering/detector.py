import os
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import io

MODEL_PATH = os.getenv("TAMPERING_MODEL_PATH", "models/tampering_model.pth")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class DocumentTamperingClassifier(nn.Module):
    def __init__(self):
        super(DocumentTamperingClassifier, self).__init__()
        self.backbone = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        num_ftrs = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Linear(num_ftrs, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 2),  # Class 0: GENUINE, Class 1: MANIPULATED
            nn.Softmax(dim=1)
        )

    def forward(self, x):
        return self.backbone(x)

tampering_model = None

def load_model():
    global tampering_model
    if tampering_model is not None:
        return tampering_model

    try:
        if os.path.exists(MODEL_PATH):
            model = DocumentTamperingClassifier().to(device)
            model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
            model.eval()
            tampering_model = model
            print(f"Loaded trained PyTorch tampering model from {MODEL_PATH}")
            return tampering_model
        else:
            print(f"Notice: Model checkpoint {MODEL_PATH} not found. Utilizing calibrated multi-signal evidence pipeline.")
            return None
    except Exception as e:
        print(f"Warning: Failed to load PyTorch model: {e}")
        return None

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def predict_document_tampering(
    image_bytes: bytes,
    forensic_result: dict = None,
    synthetic_result: dict = None,
    format_result: dict = None
) -> dict:
    """
    Evaluates document image for forgery using PyTorch CNN (if trained weights available)
    + OpenCV forensic ELA signals + synthetic markers + layout format.
    """
    model = load_model()
    pytorch_probs = None
    has_weights = os.path.exists(MODEL_PATH)

    forensic_score = forensic_result.get("forensicScore", 0) if forensic_result else 0
    synthetic_score = synthetic_result.get("syntheticScore", 0) if synthetic_result else 0
    local_splicing = forensic_result.get("localSplicingDetected", False) if forensic_result else False
    is_synthetic = synthetic_result.get("isSynthetic", False) if synthetic_result else False

    if has_weights and model is not None:
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            input_tensor = transform(pil_img).unsqueeze(0).to(device)
            with torch.no_grad():
                probs = model(input_tensor)[0]
                genuine_prob = float(probs[0])
                tampered_prob = float(probs[1])
                pytorch_probs = (genuine_prob, tampered_prob)
        except Exception as e:
            print(f"PyTorch Inference Error: {e}")

    if pytorch_probs is not None:
        combined_tampered = round(min((pytorch_probs[1] * 0.20 + (forensic_score / 100.0) * 0.45 + (synthetic_score / 100.0) * 0.35), 0.99), 2)
    else:
        # Calibrated evidence-based score when un-finetuned raw weights are not loaded
        if local_splicing and is_synthetic:
            combined_tampered = round(min(0.70 + (forensic_score / 300.0) + (synthetic_score / 300.0), 0.98), 2)
        elif local_splicing or is_synthetic:
            combined_tampered = round(min(0.40 + (forensic_score / 200.0) + (synthetic_score / 200.0), 0.90), 2)
        else:
            combined_tampered = round(max(0.04, (forensic_score / 400.0) + (synthetic_score / 400.0)), 2)

    combined_genuine = round(float(1.0 - combined_tampered), 2)
    prediction = "TAMPERED" if combined_tampered >= 0.55 else "GENUINE"

    return {
        "prediction": prediction,
        "genuineProbability": combined_genuine,
        "tamperedProbability": combined_tampered,
        "modelUsed": "ResNet18-PyTorch + Forensic-ELA + Synthetic-FFT" if has_weights else "Calibrated Multi-Signal Evidence Aggregator",
        "hasTrainedWeights": has_weights
    }
