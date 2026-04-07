import { useEffect, useState, useCallback } from "react";
import { getContacts } from "../api/client";

const EMAIL_STATUS = {
  verified: { bg: "rgba(0,212,170,0.12)",  color: "var(--emerald)", label: "verified" },
  found:    { bg: "rgba(240,165,0,0.12)",   color: "var(--gold)",    label: "found" },
  guessed:  { bg: "rgba(90,122,153,0.15)",  color: "#5a7a99",        label: "guessed" },
  invalid:  { bg: "rgba(239,68,68,0.1)",    color: "#ef4444",        label: "invalid" },
};

const PRIORITY = {
  10: { label: "C-SUITE",    color: "var(--gold)",    bg: "rgba(240,165,0,0.12)" },
  9:  { label: "CFO/PRES",   color: "#a78bfa",        bg: "rgba(167,139,250,0.12)" },
  8:  { label: "VP FIN",     color: "#60a5fa",        bg: "rgba(96,165,250,0.12)" },
  7:  { label: "VP/DIR",     color: "var(--emerald)", bg: "rgba(0,212,170,0.1)" },
  6:  { label: "COO/DIR",    color: "#34d399",        bg: "rgba(52,211,153,0.1)" },
  5:  { label: "CTRL",       color: "var(--text-secondary)", bg: "rgba(90,122,153,0.12)" },
  4:  { label: "TREAS",      color: "var(--text-secondary)", bg: "rgba(90,122,153,0.08)" },
};

export default function Contacts() {
  const [contacts, setContacts]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [hasEmail, setHasEmail]     = useState("");
  const [titleFilter, setTitle]     = useState("");

  const fetchContacts = useCallback(() => {
    setLoading(true);
    const params = { page, page_size: 50, ordering: "-priority" };
    if (search)      params.search       = search;
    if (emailStatus) params.email_status = emailStatus;
    if (hasEmail)    params.has_email    = hasEmail === "yes" ? "true" : "false";
    if (titleFilter) params.title_like   = titleFilter;

    getContacts(params)
      .then((r) => {
        const data = r.data || {};
        setContacts(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
        setTotal(data.count ?? 0);
        setTotalPages(data.total_pages ?? 1);
      })
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, [page, search, emailStatus, hasEmail, titleFilter]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="syne" style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }}>
          Contacts
        </h1>
        <p className="mono" style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6, letterSpacing: "0.04em" }}>
          {total.toLocaleString()} contacts · ranked by seniority
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search name, org, email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pill-input"
          style={{ width: 240 }}
        />
        <input
          type="text"
          placeholder="Filter title…"
          value={titleFilter}
          onChange={(e) => { setTitle(e.target.value); setPage(1); }}
          className="pill-input"
          style={{ width: 160 }}
        />
        <select value={hasEmail} onChange={(e) => { setHasEmail(e.target.value); setPage(1); }} className="pill-input">
          <option value="">Email: all</option>
          <option value="yes">Has email</option>
          <option value="no">No email</option>
        </select>
        <select value={emailStatus} onChange={(e) => { setEmailStatus(e.target.value); setPage(1); }} className="pill-input">
          <option value="">Status: all</option>
          <option value="verified">Verified</option>
          <option value="found">Found</option>
          <option value="guessed">Guessed</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Contact</th>
              <th style={{ textAlign: "left" }}>Title</th>
              <th style={{ textAlign: "left" }}>Organization</th>
              <th style={{ textAlign: "right" }}>Revenue</th>
              <th style={{ textAlign: "left" }}>Email</th>
              <th style={{ textAlign: "center" }}>Rank</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 40 }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>Loading…</span>
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 48 }}>
                  <p className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>No contacts yet</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>Run Stage 2 — Enrich to extract officer data from IRS 990</p>
                </td>
              </tr>
            ) : contacts.map((c) => {
              const status  = EMAIL_STATUS[c.email_status] || null;
              const prio    = PRIORITY[c.priority] || { label: `P${c.priority}`, color: "var(--text-secondary)", bg: "rgba(90,122,153,0.1)" };
              const revenue = c.org_revenue ? `$${(c.org_revenue / 1_000_000).toFixed(1)}M` : "—";

              return (
                <tr key={c.id}>
                  <td>
                    <p style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 13 }}>{c.full_name}</p>
                    <p className="mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{c.org_state}</p>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {c.title}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: "var(--text-primary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {c.org_name}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{revenue}</span>
                  </td>
                  <td>
                    {c.email ? (
                      <div>
                        <span className="mono" style={{ fontSize: 11, color: "var(--text-primary)", display: "block" }}>{c.email}</span>
                        {status && (
                          <span className="badge" style={{ background: status.bg, color: status.color, marginTop: 3 }}>
                            {status.label}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className="badge" style={{ background: prio.bg, color: prio.color, letterSpacing: "0.06em" }}>
                      {prio.label}
                    </span>
                  </td>
                </tr>
              );
            })}
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
