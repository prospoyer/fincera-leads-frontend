import { useEffect, useState, useRef } from "react";
import { getPipelineRuns, getPipelineStatus, triggerPipeline, stopPipeline } from "../api/client";

const ALL_STATES = [
  { code: "CA", name: "California" }, { code: "TX", name: "Texas" }, { code: "NY", name: "New York" },
  { code: "FL", name: "Florida" }, { code: "IL", name: "Illinois" }, { code: "PA", name: "Pennsylvania" },
  { code: "OH", name: "Ohio" }, { code: "GA", name: "Georgia" }, { code: "NC", name: "North Carolina" },
  { code: "MI", name: "Michigan" }, { code: "NJ", name: "New Jersey" }, { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" }, { code: "AZ", name: "Arizona" }, { code: "MA", name: "Massachusetts" },
  { code: "TN", name: "Tennessee" }, { code: "IN", name: "Indiana" }, { code: "MO", name: "Missouri" },
  { code: "MD", name: "Maryland" }, { code: "WI", name: "Wisconsin" }, { code: "CO", name: "Colorado" },
  { code: "MN", name: "Minnesota" }, { code: "SC", name: "South Carolina" }, { code: "AL", name: "Alabama" },
  { code: "LA", name: "Louisiana" }, { code: "KY", name: "Kentucky" }, { code: "OR", name: "Oregon" },
  { code: "OK", name: "Oklahoma" }, { code: "CT", name: "Connecticut" }, { code: "UT", name: "Utah" },
  { code: "IA", name: "Iowa" }, { code: "NV", name: "Nevada" }, { code: "AR", name: "Arkansas" },
  { code: "MS", name: "Mississippi" }, { code: "KS", name: "Kansas" }, { code: "NM", name: "New Mexico" },
  { code: "NE", name: "Nebraska" }, { code: "WV", name: "West Virginia" }, { code: "ID", name: "Idaho" },
  { code: "HI", name: "Hawaii" }, { code: "NH", name: "New Hampshire" }, { code: "ME", name: "Maine" },
  { code: "MT", name: "Montana" }, { code: "RI", name: "Rhode Island" }, { code: "DE", name: "Delaware" },
  { code: "SD", name: "South Dakota" }, { code: "ND", name: "North Dakota" }, { code: "AK", name: "Alaska" },
  { code: "VT", name: "Vermont" }, { code: "WY", name: "Wyoming" },
];

const HIGH_VALUE_PRESETS = {
  "Top 5 Markets":   ["CA", "TX", "NY", "FL", "IL"],
  "East Coast":      ["NY", "PA", "NJ", "VA", "MD", "MA", "CT", "NC", "GA", "FL"],
  "West Coast":      ["CA", "WA", "OR"],
  "Midwest":         ["IL", "OH", "MI", "IN", "MO", "WI", "MN", "IA"],
  "South":           ["TX", "FL", "GA", "NC", "TN", "AL", "SC", "LA", "MS"],
  "All 50 States":   ALL_STATES.map(s => s.code),
};

const STAGES = [
  { id: "discover", label: "Stage 1 — Discover",      desc: "Pull orgs from ProPublica API (uses state + revenue filters)" },
  { id: "enrich",   label: "Stage 2 — Enrich",        desc: "Download IRS 990 XML, extract officer names + compensation" },
  { id: "scrape",   label: "Stage 3 — Scrape",        desc: "Scrape org websites for direct email addresses" },
  { id: "emails",   label: "Stage 4 — Email Finding", desc: "Pattern-guess emails + SMTP verify each contact" },
  { id: "export",   label: "Stage 5 — Export",        desc: "Write leads_export.csv sorted by priority + revenue" },
];

const STATUS_STYLE = {
  running:   { bg: "rgba(96,165,250,0.1)",  color: "#60a5fa",        dot: "#60a5fa" },
  completed: { bg: "rgba(0,212,170,0.1)",   color: "var(--emerald)", dot: "var(--emerald)" },
  failed:    { bg: "rgba(239,68,68,0.1)",   color: "#ef4444",        dot: "#ef4444" },
  cancelled: { bg: "rgba(156,163,175,0.1)", color: "#9ca3af",        dot: "#9ca3af" },
};

function fmt(n) { return n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : `$${(n/1000).toFixed(0)}K`; }
function fmtDur(s) {
  if (!s) return "—";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s/60)}m ${s%60}s`;
  return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;
}

export default function Pipeline() {
  const [runs, setRuns]         = useState([]);
  const [status, setStatus]     = useState(null);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState("");
  const pollRef                 = useRef(null);

  // ── Parameters ──────────────────────────────────────────────────────────────
  const [selectedStates, setSelectedStates] = useState(["CA", "TX", "NY", "FL", "IL"]);
  const [revenueMin, setRevenueMin]         = useState(1_000_000);
  const [revenueMax, setRevenueMax]         = useState(5_000_000);
  const [maxOrgs, setMaxOrgs]               = useState(500);
  const [stage, setStage]                   = useState("discover");
  const [stateSearch, setStateSearch]       = useState("");

  const filteredStates = ALL_STATES.filter(s =>
    s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const toggleState = (code) => {
    setSelectedStates(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const applyPreset = (codes) => setSelectedStates(codes);

  const fetchData = () => {
    getPipelineRuns()
      .then(r => setRuns(Array.isArray(r.data) ? r.data : r.data?.results || []))
      .catch(() => setRuns([]));
    getPipelineStatus()
      .then(r => setStatus(r.data && typeof r.data === "object" ? r.data : null))
      .catch(() => setStatus(null));
  };

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleRun = async () => {
    setError(""); setBusy(true);
    try {
      await triggerPipeline(stage, selectedStates, revenueMin, revenueMax, maxOrgs);
      fetchData();
    } catch (e) {
      setError(e.response?.data?.error || "Failed to start pipeline.");
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    setBusy(true);
    try { await stopPipeline(); fetchData(); }
    catch (e) { setError(e.response?.data?.error || "Failed to stop."); }
    finally { setBusy(false); }
  };

  const isRunning = status?.status === "running";

  return (
    <div style={{ padding: "40px 48px", maxWidth: 900 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="syne" style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }}>
          Pipeline Control
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>
          Configure parameters and trigger data collection. Status polls every 5s.
        </p>
      </div>

      {/* Status banner */}
      {status && status.status && status.status !== "idle" && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderRadius: 10, marginBottom: 24,
          background: STATUS_STYLE[status.status]?.bg || "rgba(30,45,61,0.4)",
          border: `1px solid ${STATUS_STYLE[status.status]?.color || "var(--border)"}40`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: STATUS_STYLE[status.status]?.dot, flexShrink: 0,
              ...(isRunning ? { animation: "pulse-dot 1.4s ease infinite" } : {}),
            }} />
            <span className="mono" style={{ fontSize: 12, color: STATUS_STYLE[status.status]?.color }}>
              {isRunning ? `Running: ${status.stage}…` : `Last run: ${status.stage} — ${status.status}`}
            </span>
            {status.log && (
              <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
                {status.log.slice(0, 80)}
              </span>
            )}
          </div>
          {isRunning && (
            <button
              onClick={handleStop}
              disabled={busy}
              style={{
                background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444", fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: 12, padding: "6px 14px", borderRadius: 7, cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Stop
            </button>
          )}
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 20 }}>
          <span className="mono" style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>
        </div>
      )}

      {/* ── Config Panel ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* Stage selector */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <p className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 14 }}>Pipeline Stage</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...STAGES.map(s => s.id), "all"].map(s => (
              <label key={s} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="radio" name="stage" value={s}
                  checked={stage === s}
                  onChange={() => setStage(s)}
                  style={{ accentColor: "var(--gold)" }}
                />
                <span className="mono" style={{ fontSize: 12, color: stage === s ? "var(--gold)" : "var(--text-primary)", textTransform: "capitalize" }}>
                  {s === "all" ? "All Stages" : STAGES.find(x => x.id === s)?.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Revenue + Max Orgs */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <p className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 14 }}>Revenue Filter</p>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>Min Revenue</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--gold)" }}>{fmt(revenueMin)}</span>
            </div>
            <input type="range" min={100_000} max={4_900_000} step={100_000}
              value={revenueMin}
              onChange={e => setRevenueMin(Math.min(Number(e.target.value), revenueMax - 100_000))}
              style={{ width: "100%", accentColor: "var(--gold)" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>Max Revenue</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--gold)" }}>{fmt(revenueMax)}</span>
            </div>
            <input type="range" min={200_000} max={10_000_000} step={100_000}
              value={revenueMax}
              onChange={e => setRevenueMax(Math.max(Number(e.target.value), revenueMin + 100_000))}
              style={{ width: "100%", accentColor: "var(--gold)" }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>Max Orgs per Run</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--gold)" }}>{maxOrgs === 0 ? "Unlimited" : maxOrgs.toLocaleString()}</span>
            </div>
            <input type="range" min={0} max={2000} step={50}
              value={maxOrgs}
              onChange={e => setMaxOrgs(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--gold)" }}
            />
            <p className="mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
              Set to 0 for unlimited. Smaller runs process faster.
            </p>
          </div>
        </div>
      </div>

      {/* State selector */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
            Target States <span style={{ color: "var(--gold)", fontWeight: 700 }}>({selectedStates.length} selected)</span>
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {Object.entries(HIGH_VALUE_PRESETS).map(([label, codes]) => (
              <button key={label} onClick={() => applyPreset(codes)}
                style={{
                  background: JSON.stringify(selectedStates.slice().sort()) === JSON.stringify(codes.slice().sort())
                    ? "rgba(240,165,0,0.15)" : "transparent",
                  border: "1px solid var(--border)", color: "var(--text-secondary)",
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <input
          placeholder="Search states…"
          value={stateSearch}
          onChange={e => setStateSearch(e.target.value)}
          style={{
            width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)",
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, marginBottom: 12,
            boxSizing: "border-box", outline: "none",
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {filteredStates.map(s => {
            const selected = selectedStates.includes(s.code);
            return (
              <button key={s.code} onClick={() => toggleState(s.code)}
                title={s.name}
                style={{
                  background: selected ? "rgba(240,165,0,0.15)" : "transparent",
                  border: `1px solid ${selected ? "var(--gold)" : "var(--border)"}`,
                  color: selected ? "var(--gold)" : "var(--text-secondary)",
                  fontFamily: "'IBM Plex Mono', monospace", fontWeight: selected ? 700 : 400,
                  fontSize: 11, padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                  transition: "all 0.15s",
                }}>
                {s.code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Run summary + trigger */}
      <div style={{
        background: "rgba(240,165,0,0.04)", border: "1px solid rgba(240,165,0,0.2)",
        borderRadius: 12, padding: "20px 24px", marginBottom: 32,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
      }}>
        <div>
          <p className="syne" style={{ fontSize: 14, fontWeight: 700, color: "var(--gold)", marginBottom: 6 }}>Run Summary</p>
          <p className="mono" style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8 }}>
            Stage: <span style={{ color: "var(--text-primary)" }}>{stage === "all" ? "All Stages" : STAGES.find(x => x.id === stage)?.label}</span><br />
            States: <span style={{ color: "var(--text-primary)" }}>{selectedStates.length === 50 ? "All 50 states" : selectedStates.join(", ") || "None selected"}</span><br />
            Revenue: <span style={{ color: "var(--text-primary)" }}>{fmt(revenueMin)} – {fmt(revenueMax)}</span><br />
            Max orgs: <span style={{ color: "var(--text-primary)" }}>{maxOrgs === 0 ? "Unlimited" : maxOrgs.toLocaleString()}</span>
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={isRunning || busy || selectedStates.length === 0}
          style={{
            background: "var(--gold)", color: "#0d1b2a",
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: 14, padding: "14px 28px", borderRadius: 10,
            border: "none", cursor: "pointer", flexShrink: 0,
            opacity: (isRunning || busy || selectedStates.length === 0) ? 0.4 : 1,
            transition: "opacity 0.2s",
          }}>
          {busy ? "Starting…" : isRunning ? "Running…" : "▶ Start Pipeline"}
        </button>
      </div>

      {/* Run history */}
      <p className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12 }}>
        Run History
      </p>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Stage</th>
              <th style={{ textAlign: "left" }}>Status</th>
              <th style={{ textAlign: "left" }}>Started</th>
              <th style={{ textAlign: "right" }}>Duration</th>
              <th style={{ textAlign: "right" }}>Orgs</th>
              <th style={{ textAlign: "left" }}>Log</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 40 }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>No runs yet — configure parameters above and start</span>
                </td>
              </tr>
            ) : runs.map((run) => {
              const s = STATUS_STYLE[run.status] || { color: "var(--text-secondary)", bg: "transparent" };
              return (
                <tr key={run.id}>
                  <td><span className="mono" style={{ fontSize: 12, textTransform: "capitalize" }}>{run.stage}</span></td>
                  <td><span className="badge" style={{ background: s.bg, color: s.color }}>{run.status}</span></td>
                  <td><span className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>{new Date(run.started_at).toLocaleString()}</span></td>
                  <td style={{ textAlign: "right" }}><span className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>{fmtDur(run.duration_seconds)}</span></td>
                  <td style={{ textAlign: "right" }}><span className="mono" style={{ fontSize: 12 }}>{run.orgs_found?.toLocaleString() || "—"}</span></td>
                  <td><span className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>{run.log?.slice(0, 60) || "—"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
