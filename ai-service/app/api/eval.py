from fastapi import APIRouter
import os
import json
from evaluate_tampering_model import evaluate_test_dataset, METRICS_FILE

router = APIRouter()

@router.get("/eval/metrics")
async def get_evaluation_metrics():
    if os.path.exists(METRICS_FILE):
        with open(METRICS_FILE, 'r') as f:
            return json.load(f)
    else:
        # Run evaluation dynamically if not yet generated
        return evaluate_test_dataset()

@router.post("/eval/run")
async def run_evaluation_trigger():
    metrics = evaluate_test_dataset()
    return {
        "success": True,
        "message": "Model evaluation completed successfully",
        "results": metrics
    }
