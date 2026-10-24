import type { Facility, ScanResponse } from "./types"

const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

export async function scanImage(file: File): Promise<ScanResponse> {
  const form = new FormData()
  form.append("file", file)
  const r = await fetch(`${BASE}/api/scan`, { method: "POST", body: form })
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail ?? "Scan failed")
  return r.json()
}

export async function searchFacilities(location: string, category: string): Promise<Facility[]> {
  const r = await fetch(`${BASE}/api/facilities/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location, category }),
  })
  if (!r.ok) throw new Error("Search failed")
  return (await r.json()).results
}

export async function checkHealth(): Promise<{ ai_status: string }> {
  const r = await fetch(`${BASE}/api/health`)
  return r.json()
}