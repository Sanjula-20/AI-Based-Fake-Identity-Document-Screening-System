def check_liveness_status(has_selfie: bool) -> dict:
    """
    Evaluates liveness status.
    Marks as NOT_AVAILABLE for single static photo uploads to avoid claiming false liveness.
    """
    if not has_selfie:
        return {
            "status": "NOT_AVAILABLE",
            "details": "Selfie was not provided."
        }
    
    return {
        "status": "NOT_AVAILABLE",
        "details": "Interactive motion liveness verification is unavailable for static image uploads."
    }
