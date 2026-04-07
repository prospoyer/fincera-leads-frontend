import { useEffect, useState, useRef } from "react";
import { getPipelineRuns, getPipelineStatus, triggerPipeline } from "../api/client";

const STAGES = [
  { id: "discover", label: "Stage 1 — Discover",      desc: "Pull all 50 US states from ProPublica API" },
  { id: "enrich",   label: "Stage 2 — Enrich",        desc: "Download IRS 990 XML, extract officer names + revenue" },
  { id: "scrape",   label: "Stage 3 — Scrape",        desc: "Scrape org websites for direct email addresses" },
  { id: "emails",   label: "Stage 4 — Email Finding", desc: "Pattern guess + SMTP verify remaining contacts" },
  { id: "export",   label: "Stage 5 — Export",        desc: "Write leads_export.csv sorted by priority + revenue" },
];

const STATUS_STYLE = {
  running:   { bg: "rgba(96,165,250,0.1)",  color: "#60a5fa",        dot: "#60a5fa" },
  completed: { bg: "rgba(0,212,170,0.1)",   color: "var(--emerald)", dot: "var(--emerald)" },
  failed:    { bg: "rgba(239,68,68,0.1)",   color: "#ef4444",        dot: "#ef4444" },
};

function formatDuration(s) {
  if (!s) return "—";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export default function Pipeline() {
  const [runs, setRuns]           = useState([]);
  const [status, setStatus]       = useState(null);
  const [triggering, setTriggering] = useState(null);
  const [error, setError]         = useState("");
  const pollRef                   = useRef(null);

  const fetchData = () => {
    getPipelineRuns()
      .then((r) => setRuns(Array.isArray(r.data) ? r.data : Array.isArray(r.data?.results) ? r.data.results : []))
      .catch(() => setRuns([]));

    getPipelineStatus()
      .then((r) => setStatus(r.data && typeof r.data === "object" ? r.data : null))
      .catch(() => setStatus(null));
  };

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleTrigger = async (stage) => {
    setError("");
    setTriggering(stage);
    try {
      await triggerPipeline(stage);
      fetchData();
    } catch (e) {
      setError(e.response?.data?.error || "Failed to start pipeline.");
    } finally {
      setTriggering(null);
    }
  };

  const isRunning = status?.status === "running";

  return (
    <div style={{ padding: "40px 48px", maxWidth: 860 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="syne" style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }}>
          Pipeline
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>
          Trigger data collection stages. Status polls every 5 seconds.
        </p>
      </div>

      {/* Current status banner */}
      {status && status.status && status.status !== "idle" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderRadius: 10, marginBottom: 24,
          background: STATUS_STYLE[status.status]?.bg || "rgba(30,45,61,0.4)",
          border: `1px solid ${STATUS_STYLE[status.status]?.color || "var(--border)"}30`,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: STATUS_STYLE[status.status]?.dot,
            flexShrink: 0,
            ...(status.status === "running" ? { animation: "pulse-dot 1.4s ease infinite" } : {}),
          }} />
          <span className="mono" style={{ fontSize: 12, color: STATUS_STYLE[status.status]?.color }}>
            {status.status === "running"
              ? `Running: ${status.stage}…`
              : `Last: ${status.stage} — ${status.status}`}
          </span>
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 20 }}>
          <span className="mono" style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>
        </div>
      )}

      {/* Stage list */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 32, overflow: "hidden" }}>
        {STAGES.map((stage, i) => (
          <div
            key={stage.id}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: i < STAGES.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div>
              <p className="syne" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>
                {stage.label}
              </p>
              <p className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>{stage.desc}</p>
            </div>
            <button
              className="btn-primary"
              style={{ marginLeft: 20, flexShrink: 0, minWidth: 72 }}
              onClick={() => handleTrigger(stage.id)}
              disabled={isRunning || triggering !== null}
            >
              {triggering === stage.id ? "…" : "Run"}
            </button>
          </div>
        ))}

        {/* Full pipeline */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          background: "rgba(240,165,0,0.04)",
          borderTop: "1px solid rgba(240,165,0,0.15)",
        }}>
          <div>
            <p className="syne" style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>Full Pipeline</p>
            <p className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>Run all 5 stages in sequence (several hours)</p>
          </div>
          <button
            onClick={() => handleTrigger("all")}
            disabled={isRunning || triggering !== null}
            style={{
              background: "transparent",
              border: "1px solid var(--gold)",
              color: "var(--gold)",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              marginLeft: 20,
              flexShrink: 0,
              minWidth: 72,
              opacity: (isRunning || triggering !== null) ? 0.35 : 1,
            }}
          >
            {triggering === "all" ? "…" : "Run All"}
          </button>
        </div>
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
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 40 }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>No runs yet — trigger a stage above</span>
                </td>
              </tr>
            ) : runs.map((run) => {
              const s = STATUS_STYLE[run.status] || { color: "var(--text-secondary)", bg: "transparent" };
              return (
                <tr key={run.id}>
                  <td>
                    <span className="mono" style={{ fontSize: 12, color: "var(--text-primary)", textTransform: "capitalize" }}>{run.stage}</span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: s.bg, color: s.color }}>
                      {run.status}
                    </span>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                      {new Date(run.started_at).toLocaleString()}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                      {formatDuration(run.duration_seconds)}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="mono" style={{ fontSize: 12, color: "var(--text-primary)" }}>
                      {run.orgs_found?.toLocaleString() || "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
