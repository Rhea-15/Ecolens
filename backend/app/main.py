import logging

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .config import dataset_labels, get_settings
from .disposal import search_facilities
from .gemma_client import ModelProviderError, check_provider, run_gemma_vision
from .guardrails import apply_guardrails
from .prompts import SCAN_SYSTEM_PROMPT, build_user_prompt, extract_json
from .schemas import ActionLog, FacilityQuery, ScanResponse, ScanResult

log = logging.getLogger("ecolens")
logging.basicConfig(level=logging.INFO)

settings = get_settings()
app = FastAPI(title="EcoLens API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}


@app.get("/api/health")
async def health():
    ready, detail = await check_provider()
    return {
        "status": "ok",
        "ai_status": "ready" if ready else "unavailable",
        "detail": detail,
        "provider": settings.gemma_provider,
    }


@app.post("/api/scan", response_model=ScanResponse)
async def scan(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(415, "Unsupported image type")
    data = await file.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, "Image too large")

    labels = dataset_labels()
    hints = labels.get("label_hints", [])

    try:
        raw, model_name = await run_gemma_vision(
            SCAN_SYSTEM_PROMPT, build_user_prompt(hints), data, file.content_type
        )
    except ModelProviderError as exc:
        log.error("Model provider failed: %s", exc)
        raise HTTPException(502, str(exc))

    try:
        parsed = extract_json(raw)
        result = ScanResult(**parsed)
    except Exception as exc:
        log.error("Invalid model output. Raw text: %s", raw[:2000])
        raise HTTPException(502, f"Model returned invalid JSON: {exc}")

    result = apply_guardrails(result)
    return ScanResponse(result=result, provider=settings.gemma_provider, model=model_name)


@app.post("/api/facilities/search")
async def facilities_search(q: FacilityQuery):
    return {"results": search_facilities(q.location, q.category)}


@app.post("/api/impact/log")
async def log_action(entry: ActionLog):
    return {"status": "recorded", "entry": entry}