from .schemas import ScanResult

HARD_STOP_TERMS = {
    "swollen": "Swollen battery detected. Stop using the device, do not charge it, and take it to a battery drop-off point.",
    "bulging": "Bulging battery detected. Do not charge, puncture, or heat it. Use a battery drop-off point.",
    "exposed wire": "Exposed wiring detected. Do not use. Recycle through a specialist collection point.",
    "exposed copper": "Exposed wiring detected. Do not use. Recycle through a specialist collection point.",
    "burn": "Burn marks detected. Do not power on. Seek a qualified professional or recycle.",
    "leak": "Liquid leak detected. Do not power on. Handle with gloves and recycle safely.",
}


def apply_guardrails(result: ScanResult) -> ScanResult:
    """Deterministic overrides. Model output cannot downgrade these."""
    clue_text = " ".join(c.description.lower() for c in result.damage_clues)
    warnings = list(result.safety_warnings)

    for term, message in HARD_STOP_TERMS.items():
        if term in clue_text and message not in warnings:
            warnings.append(message)
            result.condition = "unsafe"
            result.recommended_handover = "recycle"
            result.handover_links = ["recycle"]

    if result.condition == "unsafe":
        result.recommended_handover = "recycle"
        if "recycle" not in result.handover_links:
            result.handover_links = ["recycle"]

    result.safety_warnings = warnings
    return result