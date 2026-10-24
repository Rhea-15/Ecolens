import json

SCAN_SYSTEM_PROMPT = """You are an e-waste identification assistant.
Analyse the image and return ONLY a JSON object matching this schema:
{
  "item_name": string,
  "category": one of ["phones","computers","cables","batteries","accessories","small_appliances","other"],
  "condition": one of ["working","needs_repair","damaged","unsafe","unknown"],
  "damage_clues": [{"description": string, "severity": "low"|"medium"|"high"}],
  "confidence": number between 0 and 1,
  "uncertainty_note": string,
  "dataset_label": string or null,
  "recommended_handover": "reuse"|"repair"|"recycle",
  "handover_links": array of "reuse"|"repair"|"recycle",
  "safety_warnings": array of strings
}
Rules:
- Only describe what is visible. Do not invent features.
- Every string field must be a string. Use "" for no note, never null.
- Every list field must be a list. Use [] for none, never null.
- If the image is unclear, set confidence low and explain in uncertainty_note.
- Mention swollen batteries, exposed wires, cracked screens, or burn marks as damage clues.
- Output JSON only, no prose, no markdown fences.
"""


def build_user_prompt(label_hints: list[str]) -> str:
    hints = ", ".join(label_hints) if label_hints else "none"
    return (
        "Identify the electronic item in this photo.\n"
        f"Allowed dataset label hints (use only if they fit): {hints}\n"
        "Return the JSON object only."
    )


def extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object found in model output")
    return json.loads(text[start : end + 1])