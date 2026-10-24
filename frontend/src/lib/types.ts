export type Handover = "reuse" | "repair" | "recycle"

export type ScanResult = {
  item_name: string
  category: string
  condition: "working" | "needs_repair" | "damaged" | "unsafe" | "unknown"
  damage_clues: { description: string; severity: "low" | "medium" | "high" }[]
  confidence: number
  uncertainty_note: string
  dataset_label: string | null
  recommended_handover: Handover
  handover_links: Handover[]
  safety_warnings: string[]
}

export type ScanResponse = { result: ScanResult; provider: string; model: string }

export type Facility = {
  name: string
  address: string
  city: string
  state: string
  type: string
  accepts: string[]
  accepts_note: string
  consumer_access: "open" | "confirm" | "brand_customers_only"
  contact: string
  verified_source: string
  verified_on: string
  source_url: string
}