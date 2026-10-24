from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

Category = Literal[
    "phones", "computers", "cables", "batteries",
    "accessories", "small_appliances", "other",
]
Condition = Literal["working", "needs_repair", "damaged", "unsafe", "unknown"]
Handover = Literal["reuse", "repair", "recycle"]


class DamageClue(BaseModel):
    description: str
    severity: Literal["low", "medium", "high"]


class ScanResult(BaseModel):
    item_name: str = "Unknown item"
    category: Category = "other"
    condition: Condition = "unknown"
    damage_clues: list[DamageClue] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    uncertainty_note: str = ""
    dataset_label: Optional[str] = None
    recommended_handover: Handover = "recycle"
    handover_links: list[Handover] = Field(default_factory=list)
    safety_warnings: list[str] = Field(default_factory=list)

    @field_validator("uncertainty_note", "item_name", mode="before")
    @classmethod
    def none_to_empty(cls, v):
        return "" if v is None else v

    @field_validator("damage_clues", "handover_links", "safety_warnings", mode="before")
    @classmethod
    def none_to_list(cls, v):
        return [] if v is None else v


class ScanResponse(BaseModel):
    result: ScanResult
    provider: str
    model: str


class FacilityQuery(BaseModel):
    location: str = ""
    category: str = "All items"


class ActionLog(BaseModel):
    item: str
    action: Literal["Reused", "Repaired", "Recycled"]