import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models

DATASET_ROOT = "dataset"
MODEL_SAVE_PATH = "models/tampering_model.pth"
BATCH_SIZE = 4
EPOCHS = 3
LEARNING_RATE = 0.001

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def train_model():
    train_dir = os.path.join(DATASET_ROOT, "train")
    if not os.path.exists(train_dir):
        print(f"Error: Dataset directory '{train_dir}' not found. Please run generate_test_dataset.py first.")
        return

    os.makedirs("models", exist_ok=True)

    data_transforms = {
        'train': transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'validation': transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    image_datasets = {
        x: datasets.ImageFolder(os.path.join(DATASET_ROOT, x), data_transforms[x])
        for x in ['train', 'validation']
        if os.path.exists(os.path.join(DATASET_ROOT, x))
    }

    dataloaders = {
        x: DataLoader(image_datasets[x], batch_size=BATCH_SIZE, shuffle=True)
        for x in image_datasets
    }

    print(f"Dataset loaded: {len(image_datasets['train'])} training samples on device: {device}")

    # ResNet18 Model Definition
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_ftrs, 128),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(128, 2),
        nn.Softmax(dim=1)
    )

    model = model.to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    for epoch in range(EPOCHS):
        print(f"Epoch {epoch+1}/{EPOCHS}")
        print("-" * 20)

        for phase in ['train', 'validation']:
            if phase not in dataloaders:
                continue

            model.train() if phase == 'train' else model.eval()

            running_loss = 0.0
            running_corrects = 0

            for inputs, labels in dataloaders[phase]:
                inputs = inputs.to(device)
                labels = labels.to(device)

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            epoch_loss = running_loss / len(image_datasets[phase])
            epoch_acc = running_corrects.double() / len(image_datasets[phase])

            print(f"{phase.capitalize()} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")

    torch.save(model.state_dict(), MODEL_SAVE_PATH)
    print(f"Model weights saved successfully to '{MODEL_SAVE_PATH}'.")

if __name__ == "__main__":
    train_model()
