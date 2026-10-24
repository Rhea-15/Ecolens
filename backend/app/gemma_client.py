import base64

import httpx
from google import genai
from google.genai import types

from .config import get_settings


async def run_gemma_vision(system: str, user: str, image_bytes: bytes, mime: str) -> tuple[str, str]:
    """Returns (raw_text, model_name). Supports local Ollama and the hosted Gemini API."""
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
        async with httpx.AsyncClient(timeout=180) as client:
            r = await client.post(f"{settings.ollama_base_url}/api/chat", json=payload)
            r.raise_for_status()
            return r.json()["message"]["content"], settings.ollama_model

    if settings.gemma_provider == "gemini_api":
        if not settings.gemma_api_key:
            raise RuntimeError("GEMMA_API_KEY is not set")
        client = genai.Client(api_key=settings.gemma_api_key)
        response = await client.aio.models.generate_content(
            model=settings.gemma_api_model,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime),
                full_prompt,
            ],
            config=types.GenerateContentConfig(temperature=0.1),
        )
        return response.text, settings.gemma_api_model

    raise RuntimeError(f"Unknown GEMMA_PROVIDER: {settings.gemma_provider}")