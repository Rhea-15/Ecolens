import base64

import httpx
from google import genai
from google.genai import types

from .config import get_settings


class ModelProviderError(Exception):
    """Raised when the model provider cannot return a usable answer."""


async def check_provider() -> tuple[bool, str]:
    """Used by /api/health. Returns (ready, human-readable detail)."""
    settings = get_settings()

    if settings.gemma_provider == "ollama":
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(f"{settings.ollama_base_url}/api/tags")
                r.raise_for_status()
                names = [m.get("name", "") for m in r.json().get("models", [])]
        except httpx.HTTPError:
            return False, f"Cannot reach Ollama at {settings.ollama_base_url}. Is Ollama running?"

        model = settings.ollama_model
        installed = model in names or (":" not in model and f"{model}:latest" in names)
        if installed:
            return True, f"Ollama model {model} is ready"
        return False, f"Model '{model}' is not installed. Run: ollama pull {model}"

    if settings.gemma_provider == "gemini_api":
        if settings.gemma_api_key:
            return True, f"Gemini API model {settings.gemma_api_model} configured"
        return False, "GEMMA_API_KEY is not set"

    return False, f"Unknown GEMMA_PROVIDER: {settings.gemma_provider}"


async def run_gemma_vision(system: str, user: str, image_bytes: bytes, mime: str) -> tuple[str, str]:
    """Returns (raw_text, model_name). Raises ModelProviderError on any failure."""
    settings = get_settings()

    # Gemma models on the Gemini API may not accept a separate system instruction,
    # so the system prompt is prepended to the user turn for both providers.
    full_prompt = f"{system}\n\n{user}"

    if settings.gemma_provider == "ollama":
        b64 = base64.b64encode(image_bytes).decode("ascii")
        payload = {
            "model": settings.ollama_model,
            "stream": False,
            "format": "json",
            "messages": [
                {"role": "user", "content": full_prompt, "images": [b64]},
            ],
            "options": {"temperature": 0.1},
        }
        try:
            async with httpx.AsyncClient(timeout=180) as client:
                r = await client.post(f"{settings.ollama_base_url}/api/chat", json=payload)
        except httpx.HTTPError as exc:
            raise ModelProviderError(
                f"Cannot reach Ollama at {settings.ollama_base_url} ({exc.__class__.__name__}). Is Ollama running?"
            )

        if r.status_code == 404:
            raise ModelProviderError(
                f"Model '{settings.ollama_model}' not found in Ollama. "
                f"Run: ollama pull {settings.ollama_model}, or fix OLLAMA_MODEL in .env to match `ollama list`."
            )
        if r.status_code >= 400:
            raise ModelProviderError(f"Ollama returned HTTP {r.status_code}: {r.text[:300]}")

        try:
            return r.json()["message"]["content"], settings.ollama_model
        except (KeyError, ValueError) as exc:
            raise ModelProviderError(f"Unexpected Ollama response: {exc}")

    if settings.gemma_provider == "gemini_api":
        if not settings.gemma_api_key:
            raise ModelProviderError("GEMMA_API_KEY is not set in backend/.env")
        try:
            client = genai.Client(api_key=settings.gemma_api_key)
            response = await client.aio.models.generate_content(
                model=settings.gemma_api_model,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime),
                    full_prompt,
                ],
                config=types.GenerateContentConfig(temperature=0.1),
            )
        except Exception as exc:
            raise ModelProviderError(f"Gemini API error: {exc}")

        text = response.text or ""
        if not text.strip():
            raise ModelProviderError("Gemini API returned an empty response")
        return text, settings.gemma_api_model

    raise ModelProviderError(f"Unknown GEMMA_PROVIDER: {settings.gemma_provider}")