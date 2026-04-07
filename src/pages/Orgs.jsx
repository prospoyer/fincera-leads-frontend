import { useEffect, useState, useCallback } from "react";
import { getOrgs } from "../api/client";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

function RevenueBar({ revenue }) {
  const max = 5_000_000;
  const pct = Math.min(100, Math.round((revenue / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 48, height: 3, background: "#1e2d3d", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--gold)", borderRadius: 2, opacity: 0.8 }} />
      </div>
      <span className="mono" style={{ fontSize: 12, color: "var(--text-primary)" }}>
        {revenue ? `$${(revenue / 1_000_000).toFixed(1)}M` : "—"}
      </span>
    </div>
  );
}

export default function Orgs() {
  const [orgs, setOrgs]             = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState("");
  const [state, setState]           = useState("");
  const [property, setProperty]     = useState("");

  const fetchOrgs = useCallback(() => {
    setLoading(true);
    const params = { page, page_size: 25 };
    if (search)   params.search       = search;
    if (state)    params.state        = state;
    if (property) params.has_property = property === "yes" ? "true" : "false";

    getOrgs(params)
      .then((r) => {
        const data = r.data || {};
        setOrgs(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
        setTotal(data.count ?? 0);
        setTotalPages(data.total_pages ?? 1);
      })
      .catch(() => { setOrgs([]); })
      .finally(() => setLoading(false));
  }, [page, search, state, property]);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  return (
    <div style={{ padding: "40px 48px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="syne" style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }}>
          Organizations
        </h1>
        <p className="mono" style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6, letterSpacing: "0.04em" }}>
          {total.toLocaleString()} nonprofits in database
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search name or EIN…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pill-input"
          style={{ width: 240 }}
        />
        <select
          value={state}
          onChange={(e) => { setState(e.target.value); setPage(1); }}
          className="pill-input"
        >
          <option value="">All states</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={property}
          onChange={(e) => { setProperty(e.target.value); setPage(1); }}
          className="pill-input"
        >
          <option value="">Property: any</option>
          <option value="yes">Has property ◆</option>
          <option value="no">No property</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Organization</th>
              <th style={{ textAlign: "left" }}>Location</th>
              <th style={{ textAlign: "left" }}>Revenue</th>
              <th style={{ textAlign: "center" }}>Contacts</th>
              <th style={{ textAlign: "center" }}>Property</th>
              <th style={{ textAlign: "left" }}>Website</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 40 }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>Loading…</span>
                </td>
              </tr>
            ) : orgs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 48 }}>
                  <p className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>No organizations yet</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>Run Stage 1 — Discover from the Pipeline page</p>
                </td>
              </tr>
            ) : orgs.map((org) => (
              <tr key={org.ein}>
                <td>
                  <p style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 13, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {org.name}
                  </p>
                  <p className="mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                    {org.ein}
                  </p>
                </td>
                <td>
                  <span className="mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {org.city ? `${org.city}, ` : ""}{org.state}
                  </span>
                </td>
                <td><RevenueBar revenue={org.revenue} /></td>
                <td style={{ textAlign: "center" }}>
                  <span className="badge" style={{
                    background: org.contact_count > 0 ? "rgba(0,212,170,0.12)" : "rgba(30,45,61,0.6)",
                    color: org.contact_count > 0 ? "var(--emerald)" : "var(--text-muted)",
                  }}>
                    {org.contact_count}
                  </span>
                </td>
                <td style={{ textAlign: "center" }}>
                  {org.has_property ? (
                    <span className="badge" style={{ background: "rgba(240,165,0,0.12)", color: "var(--gold)" }}>◆</span>
                  ) : (
                    <span className="mono" style={{ fontSize: 11, color: "#1e2d3d" }}>—</span>
                  )}
                </td>
                <td>
                  {org.website ? (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 11, color: "var(--text-secondary)", textDecoration: "none", fontFamily: "'IBM Plex Mono', monospace", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}
                    >
                      {org.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    </a>
                  ) : (
                    <span className="mono" style={{ fontSize: 11, color: "#1e2d3d" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px", borderTop: "1px solid var(--border)",
          background: "#0a0e17",
        }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            {total.toLocaleString()} total · page {page} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn-ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← prev</button>
            <button className="btn-ghost" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
