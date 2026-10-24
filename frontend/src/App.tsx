import { useEffect, useRef, useState } from "react"
import {
  ArrowRight, BatteryWarning, Camera, ChartNoAxesColumn, Check, ChevronDown,
  CircleCheck, ExternalLink, FileImage, History, Info, LayoutDashboard, Leaf,
  LocateFixed, Map, MapPin, PackageCheck, Recycle, RotateCcw, ScanLine, Search,
  ShieldCheck, Smartphone, Sparkles, Trash2, Upload, Wrench, X,
} from "lucide-react"
import { checkHealth, scanImage, searchFacilities } from "./lib/api"
import type { Facility, ScanResult } from "./lib/types"

type Page = "overview" | "scanner" | "repair" | "finder" | "impact"
type ActionType = "Reused" | "Repaired" | "Recycled"
type Activity = {
  id: number
  item: string
  action: string
  date: string
  status: "Demo" | "Confirmed"
}

const STORAGE_KEY = "ecolens-activities"

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "scanner", label: "AI Scanner", icon: ScanLine },
  { id: "repair", label: "Reuse & Repair", icon: Wrench },
  { id: "finder", label: "Disposal Finder", icon: MapPin },
  { id: "impact", label: "My Impact", icon: ChartNoAxesColumn },
]

function todayLabel() {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date())
}

function Logo() {
  return (
    <div className="logo-mark" aria-hidden="true">
      <span />
      <Leaf size={15} strokeWidth={2.5} />
    </div>
  )
}

function Button({
  children, variant = "primary", className = "", ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "lime"
}) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}

function PageHeader({ title, subtitle, eyebrow }: { title: string; subtitle: string; eyebrow?: string }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow dark">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </header>
  )
}

function Overview({ navigate, activities, aiReady }: {
  navigate: (p: Page) => void
  activities: Activity[]
  aiReady: boolean
}) {
  const completed = activities.filter((a) => a.status === "Confirmed")
  const counts = {
    reused: completed.filter((a) => a.action === "Reused").length,
    repaired: completed.filter((a) => a.action === "Repaired").length,
    recycled: completed.filter((a) => a.action === "Recycled").length,
  }
  return (
    <div className="overview-page">
      <PageHeader
        title="Make better choices for your e-waste."
        subtitle="Identify electronics, explore repair options, and find responsible disposal routes."
      />
      <section className="hero-card">
        <div className="hero-content">
          <p className="eyebrow">YOUR E-WASTE ASSISTANT</p>
          <span className={`ai-badge ${aiReady ? "ready" : "offline"}`}>
            <span className="pulse-dot" /> {aiReady ? "AI-Ready · Gemma 4" : "AI offline"}
          </span>
          <h2>Give your old electronics a second life.</h2>
          <p>Upload a photo to identify an item and discover what you can do with it.</p>
          <div className="button-row">
            <Button variant="lime" onClick={() => navigate("scanner")}>
              <ScanLine size={18} /> Scan an item
            </Button>
            <Button variant="ghost" onClick={() => document.querySelector("#how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
              How it works <ArrowRight size={17} />
            </Button>
          </div>
        </div>
      </section>

      <section className="section overview-how" id="how-it-works">
        <div className="section-heading">
          <div>
            <span className="kicker">SIMPLE BY DESIGN</span>
            <h2>From old tech to a better next step</h2>
          </div>
          <p>Three quick steps. Clear, responsible guidance.</p>
        </div>
        <div className="steps">
          {([
            ["01", "Identify", "Upload a photo of your electronic item.", ScanLine],
            ["02", "Choose", "Explore reuse, repair, or recycling options.", Wrench],
            ["03", "Act", "Find a collection point and track your action.", CircleCheck],
          ] as const).map(([number, title, copy, Icon], index) => (
            <div className="step" key={title}>
              <span className="step-number">{number}</span>
              <div className="step-icon"><Icon size={21} /></div>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
              {index < 2 && <span className="connector" />}
            </div>
          ))}
        </div>
      </section>

      <section className="section overview-features">
        <div className="section-heading">
          <div>
            <span className="kicker">EXPLORE</span>
            <h2>Choose where to go next</h2>
          </div>
        </div>
        <div className="feature-grid">
          {([
            ["repair", "Reuse & Repair", "Discover practical ways to extend an item's life.", "Explore options", Wrench],
            ["finder", "Disposal Finder", "Find verified e-waste collection and recycling options.", "Find a location", MapPin],
            ["impact", "My Impact", "Keep track of the e-waste actions you've completed.", "View my impact", ChartNoAxesColumn],
          ] as const).map(([page, title, copy, cta, Icon]) => (
            <article className="feature-card" key={page}>
              <div className="icon-tile"><Icon size={22} /></div>
              <h3>{title}</h3>
              <p>{copy}</p>
              <button className="text-link" onClick={() => navigate(page)}>
                {cta} <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="section activity-section overview-activity">
        <div className="activity-card">
          <div className="section-heading compact">
            <div>
              <span className="kicker">ACTIVITY</span>
              <h2>Your recent activity</h2>
            </div>
            <button className="text-link" onClick={() => navigate("impact")}>
              View all <ArrowRight size={15} />
            </button>
          </div>
          <div className="activity-list">
            {activities.slice(0, 3).map((item) => (
              <div className="activity-row" key={item.id}>
                <div className="activity-icon">
                  {item.action === "Scanned" ? <ScanLine size={17} />
                    : item.action.includes("Repair") ? <Wrench size={17} />
                    : <Recycle size={17} />}
                </div>
                <div>
                  <strong>{item.item}</strong>
                  <span>{item.action}</span>
                </div>
                <time>{item.date}</time>
                <span className={`status ${item.status.toLowerCase()}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="impact-mini">
          <span className="kicker">IMPACT</span>
          <h2>Actions, not just scans.</h2>
          <p>Only confirmed actions contribute to your impact.</p>
          <div className="mini-stats">
            <div><strong>{activities.filter((a) => a.action === "Scanned").length}</strong><span>Scanned</span></div>
            <div><strong>{counts.reused}</strong><span>Reused</span></div>
            <div><strong>{counts.repaired}</strong><span>Repaired</span></div>
            <div><strong>{counts.recycled}</strong><span>Recycled</span></div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Scanner({ navigate, logScan }: {
  navigate: (p: Page) => void
  logScan: (r: ScanResult) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [state, setState] = useState<"empty" | "ready" | "loading" | "result" | "error">("empty")
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState("")
  const [provider, setProvider] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const selectFile = (f?: File) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setState("ready")
    setResult(null)
  }
  const analyze = async () => {
    if (!file) return
    setState("loading")
    setError("")
    try {
      const res = await scanImage(file)
      setResult(res.result)
      setProvider(`${res.provider} · ${res.model}`)
      logScan(res.result)
      setState("result")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed")
      setState("error")
    }
  }
  const clear = () => {
    setPreview(null)
    setFile(null)
    setResult(null)
    setState("empty")
  }

  return (
    <>
      <PageHeader title="AI E-Waste Scanner" subtitle="Upload an electronic item to understand what it is and what to do next." />
      {state !== "result" ? (
        <section className="scanner-layout">
          <div
            className={`upload-zone ${preview ? "has-image" : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); selectFile(e.dataTransfer.files[0]) }}
          >
            {preview ? (
              <>
                <img src={preview} alt="Selected electronic item preview" />
                {state === "loading" && (
                  <div className="scanning-overlay">
                    <span className="scan-line" />
                    <div>
                      <ScanLine size={25} />
                      <strong>Identifying your item…</strong>
                      <small>Gemma 4 is reviewing visible features</small>
                    </div>
                  </div>
                )}
                {(state === "ready" || state === "error") && (
                  <div className="image-actions">
                    <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                      <RotateCcw size={16} /> Replace
                    </Button>
                    <Button variant="secondary" onClick={clear}>
                      <Trash2 size={16} /> Remove
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="upload-content">
                <div className="upload-icon"><Upload size={25} /></div>
                <h2>Drop an image here or browse files</h2>
                <p>Use a clear photo showing the electronic item.</p>
                <Button onClick={() => fileRef.current?.click()}>
                  <FileImage size={17} /> Upload image
                </Button>
                <button className="camera-link" onClick={() => fileRef.current?.click()}>
                  <Camera size={16} /> Use camera
                </button>
                <span>JPEG, PNG or WEBP • up to 10 MB</span>
              </div>
            )}
            <input
              ref={fileRef}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(e) => selectFile(e.target.files?.[0])}
            />
          </div>
          <aside className="scanner-side">
            <span className="kicker">PHOTO TIPS</span>
            <h2>Help the AI see clearly</h2>
            <ul className="check-list">
              <li><Check size={16} /> Keep the full item in frame</li>
              <li><Check size={16} /> Use bright, even lighting</li>
              <li><Check size={16} /> Show ports or labels if visible</li>
            </ul>
            <div className="privacy-note">
              <ShieldCheck size={19} />
              <div>
                <strong>Processed by your local model</strong>
                <p>Images are sent only to your EcoLens backend.</p>
              </div>
            </div>
          </aside>
          {(state === "ready" || state === "error") && (
            <div className="analyze-bar">
              <div>
                <strong>{state === "error" ? "Analysis failed" : "Image ready"}</strong>
                <span>{state === "error" ? error : "Continue to run Gemma 4 analysis."}</span>
              </div>
              <Button onClick={analyze}><Sparkles size={17} /> Analyse item</Button>
            </div>
          )}
        </section>
      ) : result && (
        <section className="results">
          <div className="result-top">
            <div className="result-image">
              <img src={preview!} alt="Analysed electronic item" />
              <span><Sparkles size={14} /> {provider}</span>
            </div>
            <div className="result-copy">
              <span className="kicker">IDENTIFICATION</span>
              <div className="confidence">
                <span>{result.condition.replace("_", " ")}</span>
                <strong>{Math.round(result.confidence * 100)}% confidence</strong>
              </div>
              <h2>{result.item_name}</h2>
              <p className="category">{result.category.replace("_", " ")}</p>
              {result.damage_clues.length > 0 && (
                <ul className="check-list">
                  {result.damage_clues.map((c, i) => (
                    <li key={i}><Info size={16} /> {c.description} ({c.severity})</li>
                  ))}
                </ul>
              )}
              {result.safety_warnings.map((w) => (
                <div className="safety-banner" key={w}><BatteryWarning size={23} /><div><p>{w}</p></div></div>
              ))}
              <div className="disclaimer">
                <Info size={16} />
                {result.uncertainty_note || "AI identification may be incorrect. Check the item before making disposal decisions."}
              </div>
            </div>
          </div>
          <div className="next-heading">
            <div>
              <span className="kicker">WHAT'S NEXT</span>
              <h2>Choose the right next step</h2>
            </div>
            <span className="recommended-label">
              <Sparkles size={14} /> Recommended: {result.recommended_handover}
            </span>
          </div>
          <div className="action-grid">
            {result.handover_links.includes("reuse") && (
              <ActionCard icon={PackageCheck} title="Reuse" copy="If it works safely, keep it as a spare or pass it on."
                recommended={result.recommended_handover === "reuse"} cta="Explore reuse ideas" onClick={() => navigate("repair")} />
            )}
            {result.handover_links.includes("repair") && (
              <ActionCard icon={Wrench} title="Repair" copy="Check connectors and casing before deciding."
                recommended={result.recommended_handover === "repair"} cta="Explore repair options" onClick={() => navigate("repair")} />
            )}
            {result.handover_links.includes("recycle") && (
              <ActionCard icon={Recycle} title="Recycle" copy="Use a specialist drop-off for damaged or unsafe items."
                recommended={result.recommended_handover === "recycle"} cta="Find recycling options" onClick={() => navigate("finder")} />
            )}
          </div>
          <Button variant="secondary" onClick={clear}><ScanLine size={17} /> Scan another item</Button>
        </section>
      )}
    </>
  )
}

function ActionCard({ icon: Icon, title, copy, cta, recommended, onClick }: {
  icon: typeof Wrench; title: string; copy: string; cta: string; recommended?: boolean; onClick: () => void
}) {
  return (
    <article className={`action-card ${recommended ? "recommended" : ""}`}>
      {recommended && <span className="top-badge">Best next step</span>}
      <div className="icon-tile"><Icon size={22} /></div>
      <h3>{title}</h3>
      <p>{copy}</p>
      <Button variant={recommended ? "primary" : "secondary"} onClick={onClick}>
        {cta} <ArrowRight size={16} />
      </Button>
    </article>
  )
}

function RepairAdvisor({ logAction, navigate, scanned }: {
  logAction: (a: ActionType, item: string) => void
  navigate: (p: Page) => void
  scanned: ScanResult | null
}) {
  const [confirm, setConfirm] = useState<ActionType | null>(null)
  const itemName = scanned?.item_name ?? "No item selected"
  const unsafe = scanned?.condition === "unsafe"
  const cards: { title: ActionType; icon: typeof Wrench; copy: string; bullets: string[]; button: string }[] = [
    { title: "Reused", icon: PackageCheck, copy: "Best when the item works reliably and has no visible damage.",
      bullets: ["Keep as a labelled spare", "Pass on with a compatible device"], button: "Mark as reused" },
    { title: "Repaired", icon: Wrench, copy: "Consider a professional check if the item needs repair but is not unsafe.",
      bullets: ["Inspect the outer casing", "Avoid temporary tape repairs"], button: "Mark as repaired" },
    { title: "Recycled", icon: Recycle, copy: "Choose specialist recycling when the item is damaged, unsafe or no longer useful.",
      bullets: ["Bundle loose cables", "Use a verified collection point"], button: "Log recycling handover" },
  ]
  return (
    <div className="repair-page aligned-page">
      <PageHeader title="Reuse & Repair" subtitle="Explore safe ways to extend the life of your electronics." />
      <div className="item-context">
        <div className="item-thumb"><Smartphone size={21} /></div>
        <div>
          <span>Selected item</span>
          <strong>{itemName}</strong>
        </div>
        <button className="text-link" onClick={() => navigate("scanner")}>
          Choose another item <ChevronDown size={15} />
        </button>
      </div>
      <section className="recommendation">
        <div className="recommendation-icon"><PackageCheck size={26} /></div>
        <div>
          <span className="kicker">RECOMMENDED ACTION</span>
          <h2>{unsafe ? "Recycle — do not reuse" : scanned ? `Try ${scanned.recommended_handover} first` : "Scan an item first"}</h2>
          <p>{scanned
            ? "Recommendation is based on the Gemma 4 analysis and deterministic safety rules. Confirm the condition yourself."
            : "Upload an item in the AI Scanner to get a tailored recommendation."}</p>
        </div>
        {scanned && (
          <div className="reason">
            <Check size={17} />
            <span><strong>Why this fits</strong>{scanned.uncertainty_note || "Based on visible features in the photo."}</span>
          </div>
        )}
      </section>
      <div className="guidance-grid">
        {cards.map((card, i) => (
          <article className="guidance-card" key={card.title}>
            <div className="guidance-head">
              <div className="icon-tile"><card.icon size={21} /></div>
              <span>0{i + 1}</span>
            </div>
            <h2>{card.title === "Reused" ? "Reuse" : card.title === "Repaired" ? "Repair" : "Recycle"}</h2>
            <p>{card.copy}</p>
            <ul>{card.bullets.map((b) => <li key={b}><Check size={15} />{b}</li>)}</ul>
            {card.title === "Recycled" && (
              <button className="text-link" onClick={() => navigate("finder")}>
                Open Disposal Finder <ExternalLink size={14} />
              </button>
            )}
            <Button variant={i === 0 ? "primary" : "secondary"} onClick={() => setConfirm(card.title)}>
              {card.button}
            </Button>
          </article>
        ))}
      </div>
      <div className="safety-banner">
        <BatteryWarning size={23} />
        <div>
          <strong>Safety first</strong>
          <p>Never open or puncture batteries, or handle exposed electrical components. Ask a qualified professional when a repair is uncertain.</p>
        </div>
      </div>
      {confirm && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <button className="modal-close" aria-label="Close dialog" onClick={() => setConfirm(null)}><X size={19} /></button>
            <div className="modal-icon"><CircleCheck size={25} /></div>
            <h2 id="confirm-title">Confirm completed action</h2>
            <p>Have you actually {confirm.toLowerCase()} this {itemName.toLowerCase()}? Viewing advice alone won't count.</p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setConfirm(null)}>Not yet</Button>
              <Button onClick={() => { logAction(confirm, itemName); setConfirm(null) }}>Yes, record action</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ACCESS_LABEL: Record<Facility["consumer_access"], string> = {
  open: "Open to the public",
  confirm: "Call to confirm before visiting",
  brand_customers_only: "Listed for specific brand customers",
}

function Finder() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All items")
  const [results, setResults] = useState<Facility[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState("")

  const runSearch = async () => {
    setLoading(true)
    setError("")
    try {
      setResults(await searchFacilities(query, category))
      setSearched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { runSearch() }, [])

  return (
    <div className="finder-page aligned-page">
      <PageHeader
        title="Find responsible disposal options"
        subtitle="Verified e-waste collection points and recyclers in India, sourced from official and company records."
      />
      <section className="search-panel">
        <label>
          <span>Location, city or state</span>
          <div className="input-wrap">
            <MapPin size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “Mumbai”, “Pune” or “Maharashtra”"
            />
          </div>
        </label>
        <label>
          <span>Item category</span>
          <div className="select-wrap">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>All items</option>
              <option>Phones</option>
              <option>Cables</option>
              <option>Batteries</option>
              <option>Computers</option>
              <option>Accessories</option>
            </select>
            <ChevronDown size={16} />
          </div>
        </label>
        <Button onClick={runSearch} disabled={loading}>
          <Search size={17} /> {loading ? "Searching…" : "Search locations"}
        </Button>
      </section>
      <section className="finder-layout">
        <div className="facility-list">
          <div className="results-count">
            <strong>{results.length} verified options</strong>
            <span>{searched ? "Matching your filters" : "Loading…"}</span>
          </div>
          {error && <p className="error-text">{error}</p>}
          {results.length ? results.map((facility) => (
            <article className="facility-card" key={facility.name}>
              <div className="facility-top">
                <span className="verified"><ShieldCheck size={14} /> Verified source</span>
                <span>{facility.type}</span>
              </div>
              <h2>{facility.name}</h2>
              <p className="address">{facility.address}</p>
              <p className="verified-date">{facility.city}, {facility.state}</p>
              <div className="tags">
                {facility.accepts.length
                  ? facility.accepts.map((item) => <span key={item}>{item}</span>)
                  : <span>Accepted items: confirm by phone</span>}
              </div>
              {facility.accepts_note && <p className="verified-date">{facility.accepts_note}</p>}
              <p className="verified-date">Access: {ACCESS_LABEL[facility.consumer_access]}</p>
              {facility.contact && <p className="verified-date">Contact: {facility.contact}</p>}
              <p className="verified-date">
                Source:{" "}
                <a href={facility.source_url} target="_blank" rel="noreferrer">
                  {facility.verified_source}
                </a>{" "}
                • checked {facility.verified_on}
              </p>
              <div className="button-row">
                <a className="button button-secondary" target="_blank" rel="noreferrer"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.address)}`}>
                  <Map size={16} /> View on map
                </a>
                <a className="text-link" target="_blank" rel="noreferrer"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(facility.address)}`}>
                  Get directions <ExternalLink size={14} />
                </a>
              </div>
            </article>
          )) : (
            <div className="empty-state">
              <Search size={28} />
              <h2>No verified collection point found</h2>
              <p>Try a broader location, or choose "All items". Facilities only appear under a specific category once their accepted items are confirmed.</p>
            </div>
          )}
        </div>
        <div className="map-placeholder">
          <div className="map-grid" />
          <div className="map-roads one" />
          <div className="map-roads two" />
          {results.slice(0, 3).map((_, i) => (
            <span key={i} className={`map-pin pin-${i + 1}`}><MapPin size={17} fill="currentColor" /></span>
          ))}
          <div className="map-message">
            <LocateFixed size={19} />
            <div>
              <strong>Map preview</strong>
              <span>Use "View on map" for live directions.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Impact({ activities, reset }: { activities: Activity[]; reset: () => void }) {
  const [filter, setFilter] = useState("All activity")
  const confirmed = activities.filter((a) => a.status === "Confirmed")
  const visible = filter === "All activity" ? activities : activities.filter((a) => a.action === filter)
  const count = (action: string) => confirmed.filter((a) => a.action === action).length
  const stats: [string, number, typeof ScanLine][] = [
    ["Items scanned", activities.filter((a) => a.action === "Scanned").length, ScanLine],
    ["Items reused", count("Reused"), PackageCheck],
    ["Items repaired", count("Repaired"), Wrench],
    ["Items recycled", count("Recycled"), Recycle],
  ]
  const goal = 5
  const progress = Math.min(100, (confirmed.length / goal) * 100)
  return (
    <div className="impact-page aligned-page">
      <PageHeader eyebrow="METRICS & HISTORY" title="My Impact" subtitle="Every completed action is a step toward responsible e-waste management." />
      <div className="stats-grid">
        {stats.map(([label, value, Icon]) => (
          <article className="stat-card" key={label}>
            <div className="icon-tile"><Icon size={20} /></div>
            <span>{label}</span>
            <strong>{String(value).padStart(2, "0")}</strong>
          </article>
        ))}
      </div>
      <section className="goal-card">
        <div className="goal-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
          <span>{Math.min(confirmed.length, goal)}/{goal}</span>
        </div>
        <div>
          <span className="kicker">YOUR PERSONAL GOAL</span>
          <h2>Responsibly handle 5 electronic items</h2>
          <p>Progress counts confirmed reuse, repair, and recycling actions only.</p>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        </div>
        <CircleCheck size={35} />
      </section>
      <section className="history-card">
        <div className="history-head">
          <div>
            <span className="kicker">HISTORY</span>
            <h2>Activity history</h2>
          </div>
          <div className="history-actions">
            <div className="select-wrap small">
              <select aria-label="Filter activity" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option>All activity</option>
                <option>Reused</option>
                <option>Repaired</option>
                <option>Recycled</option>
                <option>Scanned</option>
              </select>
              <ChevronDown size={15} />
            </div>
            <Button variant="ghost" onClick={reset}><RotateCcw size={15} /> Reset</Button>
          </div>
        </div>
        {visible.length ? (
          <div className="table">
            <div className="table-head"><span>Item</span><span>Action taken</span><span>Date</span><span>Status</span></div>
            {visible.map((a) => (
              <div className="table-row" key={a.id}>
                <strong>{a.item}</strong>
                <span>{a.action}</span>
                <span>{a.date}</span>
                <span className={`status ${a.status.toLowerCase()}`}>{a.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state compact">
            <History size={26} />
            <h2>No activity yet</h2>
            <p>Your confirmed actions will appear here.</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>("overview")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [toast, setToast] = useState("")
  const [aiReady, setAiReady] = useState(false)
  const [lastScan, setLastScan] = useState<ScanResult | null>(null)
  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(activities)) }, [activities])
  useEffect(() => {
    checkHealth().then((h) => setAiReady(h.ai_status === "ready")).catch(() => setAiReady(false))
  }, [])
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
    setMobileOpen(false)
  }, [page])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(""), 3500)
  }
  const logScan = (r: ScanResult) => {
    setLastScan(r)
    setActivities((items) => [
      { id: Date.now(), item: r.item_name, action: "Scanned", date: todayLabel(), status: "Demo" },
      ...items,
    ])
  }
  const logAction = (action: ActionType, item: string) => {
    setActivities((items) => [
      { id: Date.now(), item, action, date: todayLabel(), status: "Confirmed" },
      ...items,
    ])
    showToast(`Action recorded — marked as ${action.toLowerCase()}.`)
  }
  const reset = () => {
    setActivities([])
    showToast("Activity has been reset.")
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
        <Logo />
      </button>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand">
          <button
            className="logo-toggle"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => (mobileOpen ? setMobileOpen(false) : setSidebarCollapsed((c) => !c))}
          >
            <Logo />
          </button>
          <div className="brand-copy">
            <strong>EcoLens</strong>
            <span>E-waste intelligence</span>
          </div>
          <button className="sidebar-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
            <X size={19} />
          </button>
        </div>
        <nav>
          {navItems.map((item) => (
            <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => setPage(item.id)}>
              <item.icon size={19} />
              <span>{item.label}</span>
              {page === item.id && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div><Recycle size={19} /></div>
          <strong>Small actions.<br />Less e-waste.</strong>
          <span>Make your next electronic item count.</span>
        </div>
      </aside>
      <main>
        {page === "overview" && <Overview navigate={setPage} activities={activities} aiReady={aiReady} />}
        {page === "scanner" && <Scanner navigate={setPage} logScan={logScan} />}
        {page === "repair" && <RepairAdvisor navigate={setPage} logAction={logAction} scanned={lastScan} />}
        {page === "finder" && <Finder />}
        {page === "impact" && <Impact activities={activities} reset={reset} />}
        <footer><span>EcoLens</span></footer>
      </main>
      {toast && (
        <div className="toast" role="status"><span><Check size={17} /></span>{toast}</div>
      )}
    </div>
  )
}