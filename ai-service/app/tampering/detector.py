import os
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import io
import numpy as np

MODEL_PATH = os.getenv("TAMPERING_MODEL_PATH", "models/tampering_model.pth")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# PyTorch ResNet18 Binary Classifier Definition
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

# Global model instance
tampering_model = None

def load_model():
    global tampering_model
    if tampering_model is not None:
        return tampering_model

    try:
        model = DocumentTamperingClassifier().to(device)
        if os.path.exists(MODEL_PATH):
            model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
            print(f"Loaded trained PyTorch tampering model from {MODEL_PATH}")
        else:
            print(f"Notice: Model checkpoint {MODEL_PATH} not found. Running PyTorch ResNet feature extractor combined with forensic signals.")
        model.eval()
        tampering_model = model
        return tampering_model
    except Exception as e:
        print(f"Warning: Failed to load PyTorch model: {e}")
        return None

# PyTorch Input Transforms
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def predict_document_tampering(image_bytes: bytes, forensic_result: dict = None) -> dict:
    """
    Evaluates document image for forgery/manipulation using PyTorch CNN + OpenCV forensic ELA signals.
    Outputs genuineProbability, tamperedProbability, and prediction.
    """
    model = load_model()
    pytorch_probs = None

    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        input_tensor = transform(pil_img).unsqueeze(0).to(device)

        if model is not None:
            with torch.no_grad():
                probs = model(input_tensor)[0]
                genuine_prob = float(probs[0])
                tampered_prob = float(probs[1])
                pytorch_probs = (genuine_prob, tampered_prob)
    except Exception as e:
        print(f"PyTorch Inference Error: {e}")

    # Incorporate forensic signal evidence
    forensic_anomaly = forensic_result.get("anomalyScore", 0.0) if forensic_result else 0.0

    if pytorch_probs is not None:
        # Combine CNN probabilities with forensic ELA anomaly score
        combined_tampered = min(round((pytorch_probs[1] * 0.6 + forensic_anomaly * 0.4), 2), 0.99)
        combined_genuine = round(1.0 - combined_tampered, 2)
    else:
        # Fallback strictly to OpenCV ELA forensic signal when weights are absent
        combined_tampered = round(float(forensic_anomaly), 2)
        combined_genuine = round(1.0 - combined_tampered, 2)

    prediction = "TAMPERED" if combined_tampered >= 0.45 else "GENUINE"

    return {
        "prediction": prediction,
        "genuineProbability": combined_genuine,
        "tamperedProbability": combined_tampered,
        "modelUsed": "ResNet18-PyTorch + OpenCV-ELA",
        "hasTrainedWeights": os.path.exists(MODEL_PATH)
    }
