import { useEffect, useState } from "react";
import { getStats, exportCsv } from "../api/client";

function StatCard({ label, value, sub, accent = false, delay = 0 }) {
  return (
    <div
      className="stat-card animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 10 }}>
        {label}
      </p>
      <p className="syne mono" style={{
        fontSize: 32, fontWeight: 700,
        color: accent ? "var(--gold)" : "var(--text-primary)",
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}>
        {value ?? "—"}
      </p>
      {sub && (
        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>{sub}</p>
      )}
    </div>
  );
}

function BarRow({ label, value, max, color = "var(--gold)" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span className="mono" style={{ width: 28, fontSize: 11, color: "var(--text-secondary)", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 3, background: "#1e2d3d", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: color,
          borderRadius: 2,
          transition: "width 0.6s ease",
          boxShadow: `0 0 6px ${color}60`,
        }} />
      </div>
      <span className="mono" style={{ width: 32, fontSize: 11, color: "var(--text-secondary)", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  useEffect(() => {
    getStats()
      .then((r) => {
        if (r.data && typeof r.data === "object") setStats(r.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 48, display: "flex", alignItems: "center", gap: 10 }}>
      <div className="pulse-dot" style={{ width: 6, height: 6, background: "var(--gold)", borderRadius: "50%" }} />
      <span className="mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>Loading data…</span>
    </div>
  );

  if (error || !stats) return (
    <div style={{ padding: 48 }}>
      <p className="mono" style={{ fontSize: 12, color: "#ef4444" }}>Failed to connect to API. Check VITE_API_URL.</p>
    </div>
  );

  const fmt = (n) => (n ?? 0).toLocaleString();
  const orgs_by_state = Array.isArray(stats.orgs_by_state) ? stats.orgs_by_state : [];
  const top_titles    = Array.isArray(stats.top_titles) ? stats.top_titles : [];
  const maxState = orgs_by_state[0]?.count || 1;

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
        <div className="animate-fade-up">
          <h1 className="syne" style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", margin: 0 }}>
            Lead Intelligence
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 6 }}>
            US nonprofits · $1M–$5M revenue · senior contacts
          </p>
        </div>
        <a
          href={exportCsv()}
          className="btn-primary animate-fade-up"
          style={{ textDecoration: "none", animationDelay: "100ms" }}
        >
          Export CSV ↓
        </a>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard label="Organizations"   value={fmt(stats.total_orgs)}           sub="in revenue range"          delay={0}   />
        <StatCard label="Contacts"        value={fmt(stats.total_contacts)}        sub="senior titles only"        delay={60}  />
        <StatCard label="Emails Found"    value={fmt(stats.contacts_with_email)}   sub={`${stats.email_coverage_pct ?? 0}% coverage`} accent delay={120} />
        <StatCard label="Property Owners" value={fmt(stats.has_property_orgs)}     sub="real estate signal"        delay={180} />
      </div>

      {/* Email breakdown */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "20px 24px",
        marginBottom: 24,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 0,
      }} className="animate-fade-up" style2={{ animationDelay: "200ms" }}>
        {[
          { label: "Verified (SMTP)",  value: stats.verified_emails, color: "var(--emerald)" },
          { label: "Found on website", value: stats.found_emails,    color: "var(--gold)" },
          { label: "Guessed",          value: stats.guessed_emails,  color: "#5a7a99" },
        ].map(({ label, value, color }, i) => (
          <div key={label} style={{
            textAlign: "center",
            padding: "12px 0",
            borderRight: i < 2 ? "1px solid var(--border)" : "none",
          }}>
            <p className="mono" style={{ fontSize: 26, fontWeight: 500, color, letterSpacing: "-0.02em" }}>
              {fmt(value)}
            </p>
            <p className="mono" style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* By state */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
          <p className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 18 }}>
            Top States
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {orgs_by_state.slice(0, 10).map(({ state, count }) => (
              <BarRow key={state} label={state} value={count} max={maxState} />
            ))}
            {orgs_by_state.length === 0 && (
              <p className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>No data yet — run Stage 1</p>
            )}
          </div>
        </div>

        {/* By title */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
          <p className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 18 }}>
            Contact Titles
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {top_titles.slice(0, 10).map(({ title, count }) => (
              <div key={title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-primary)", maxWidth: "78%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {title}
                </span>
                <span className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>{count}</span>
              </div>
            ))}
            {top_titles.length === 0 && (
              <p className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>No data yet — run Stage 2</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
