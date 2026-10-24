from app.guardrails import apply_guardrails
from app.schemas import ScanResult, DamageClue


def make(clues, condition="working", handover="reuse", links=None):
    return ScanResult(
        item_name="Test", category="batteries", condition=condition,
        damage_clues=[DamageClue(description=c, severity="high") for c in clues],
        confidence=0.9, uncertainty_note="", recommended_handover=handover,
        handover_links=links or [handover], safety_warnings=[],
    )


def test_swollen_battery_forces_recycle():
    r = apply_guardrails(make(["the battery looks swollen"]))
    assert r.condition == "unsafe"
    assert r.recommended_handover == "recycle"
    assert r.handover_links == ["recycle"]
    assert any("Swollen" in w for w in r.safety_warnings)


def test_exposed_wire_forces_recycle():
    r = apply_guardrails(make(["exposed wire near the plug"], handover="repair", links=["repair"]))
    assert r.recommended_handover == "recycle"


def test_model_cannot_downgrade_unsafe():
    r = apply_guardrails(make([], condition="unsafe", handover="reuse", links=["reuse"]))
    assert r.recommended_handover == "recycle"


def test_clean_item_untouched():
    r = apply_guardrails(make(["minor scratch"]))
    assert r.condition == "working"
    assert r.recommended_handover == "reuse"