import os
import cv2
import numpy as np

DATASET_ROOT = "dataset"
SPLITS = ["train", "validation", "test"]
CLASSES = ["genuine", "manipulated"]

def create_synthetic_document(is_manipulated: bool, doc_id: str) -> np.ndarray:
    """
    Generates a synthetic identity document canvas for model testing and training.
    If is_manipulated=True, introduces realistic forgery artifacts (text splice, noise patch, ELA inconsistency).
    """
    # Create background card canvas (600x400)
    img = np.full((400, 600, 3), (245, 245, 248), dtype=np.uint8)

    # Draw header band
    cv2.rectangle(img, (0, 0), (600, 700), (220, 200, 180), -1)
    cv2.rectangle(img, (0, 0), (600, 60), (140, 60, 30), -1)

    # Card Title
    cv2.putText(img, "IDENTITY DOCUMENT - SCREENING TEST", (30, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)

    # Portrait photo box
    cv2.rectangle(img, (40, 90), (180, 260), (180, 180, 180), -1)
    cv2.circle(img, (110, 150), 35, (100, 100, 100), -1)
    cv2.ellipse(img, (110, 230), (50, 40), 0, 180, 360, (100, 100, 100), -1)
    cv2.rectangle(img, (40, 90), (180, 260), (80, 80, 80), 2)

    # Text fields
    cv2.putText(img, "NAME: SAMPLE CITIZEN", (210, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 20, 20), 2)
    cv2.putText(img, f"DOC NO: ABC{doc_id:05d}X", (210, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 20, 20), 2)
    cv2.putText(img, "DOB: 15/08/1992", (210, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (20, 20, 20), 2)
    cv2.putText(img, "ISSUER: GOVERNMENT AUTHORITY", (210, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (80, 80, 80), 1)

    # Draw bottom barcode/MRZ strip
    cv2.rectangle(img, (40, 300), (560, 360), (255, 255, 255), -1)
    cv2.rectangle(img, (40, 300), (560, 360), (180, 180, 180), 1)
    cv2.putText(img, f"P<INDNAME<<CITIZEN<<<<<<<<<<<<<<<<<<<<<<<<<<", (50, 325), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (10, 10, 10), 1)
    cv2.putText(img, f"ABC{doc_id:05d}X9IND9208154M2810158<<<<<<<<<<<04", (50, 345), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (10, 10, 10), 1)

    if is_manipulated:
        # Introduce Spliced Text Manipulation in DOC NO region
        cv2.rectangle(img, (310, 132), (430, 158), (255, 255, 255), -1)
        cv2.putText(img, "999999", (315, 152), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
        # Add local Gaussian noise artifact to simulate region copy-paste
        noise = np.random.normal(0, 35, (40, 120, 3)).astype(np.uint8)
        img[125:165, 310:430] = cv2.add(img[125:165, 310:430], noise)

    return img

def build_dataset(num_samples_per_class: int = 10):
    print("Generating structured test & training dataset...")
    count = 0
    for split in SPLITS:
        for cls in CLASSES:
            dir_path = os.path.join(DATASET_ROOT, split, cls)
            os.makedirs(dir_path, exist_ok=True)
            
            is_fake = (cls == "manipulated")
            for i in range(1, num_samples_per_class + 1):
                doc_img = create_synthetic_document(is_fake, f"{count:04d}")
                file_name = f"{cls}_doc_{i:03d}.jpg"
                full_path = os.path.join(dir_path, file_name)
                cv2.imwrite(full_path, doc_img)
                count += 1
    print(f"Dataset successfully created in ./{DATASET_ROOT} with {count} total sample images.")

if __name__ == "__main__":
    build_dataset()
