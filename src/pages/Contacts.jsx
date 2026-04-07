import { useEffect, useState, useCallback } from "react";
import { getContacts } from "../api/client";

const EMAIL_STATUS_COLORS = {
  verified: "bg-emerald-100 text-emerald-700",
  found:    "bg-brand-100 text-brand-700",
  guessed:  "bg-amber-100 text-amber-700",
  invalid:  "bg-red-100 text-red-600",
};

const PRIORITY_LABELS = {
  10: { label: "CEO/ED", color: "bg-purple-100 text-purple-700" },
  9:  { label: "CFO/President", color: "bg-blue-100 text-blue-700" },
  8:  { label: "VP Finance", color: "bg-brand-100 text-brand-700" },
  7:  { label: "VP/Dir Finance", color: "bg-cyan-100 text-cyan-700" },
  6:  { label: "COO/Dir Ops", color: "bg-teal-100 text-teal-700" },
  5:  { label: "Controller", color: "bg-slate-100 text-slate-600" },
  4:  { label: "Treasurer", color: "bg-slate-100 text-slate-500" },
};

function PriorityBadge({ priority }) {
  const p = PRIORITY_LABELS[priority] || { label: `P${priority}`, color: "bg-slate-100 text-slate-500" };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.color}`}>{p.label}</span>
  );
}

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(false);

  const [search, setSearch]       = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [hasEmail, setHasEmail]   = useState("");
  const [titleFilter, setTitle]   = useState("");

  const fetchContacts = useCallback(() => {
    setLoading(true);
    const params = { page, page_size: 50, ordering: "-priority" };
    if (search)      params.search       = search;
    if (emailStatus) params.email_status = emailStatus;
    if (hasEmail)    params.has_email    = hasEmail === "yes" ? "true" : "false";
    if (titleFilter) params.title_like   = titleFilter;

    getContacts(params)
      .then((r) => {
        setContacts(r.data.results ?? r.data);
        setTotal(r.data.count ?? 0);
        setTotalPages(r.data.total_pages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, emailStatus, hasEmail, titleFilter]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const fmtRevenue = (n) => n ? `$${(n / 1_000_000).toFixed(1)}M` : "—";

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
        <p className="text-slate-500 text-sm mt-1">
          {total.toLocaleString()} senior contacts — sorted by title seniority
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search name, org, email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <input
          type="text"
          placeholder="Filter by title…"
          value={titleFilter}
          onChange={(e) => { setTitle(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={hasEmail}
          onChange={(e) => { setHasEmail(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Email: all</option>
          <option value="yes">Has email</option>
          <option value="no">No email yet</option>
        </select>
        <select
          value={emailStatus}
          onChange={(e) => { setEmailStatus(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Status: all</option>
          <option value="verified">Verified</option>
          <option value="found">Found (website)</option>
          <option value="guessed">Guessed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Contact</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Title</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Organization</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Revenue</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">Loading…</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">No contacts found.</td></tr>
            ) : contacts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{c.full_name}</p>
                  <p className="text-xs text-slate-400">{c.org_state}</p>
                </td>
                <td className="px-4 py-3 text-slate-600 max-w-[180px]">
                  <span className="truncate block">{c.title}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-slate-700 truncate block max-w-[200px]">{c.org_name}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-700">
                  {fmtRevenue(c.org_revenue)}
                </td>
                <td className="px-4 py-3">
                  {c.email ? (
                    <div>
                      <p className="text-slate-800 text-xs font-mono">{c.email}</p>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium mt-0.5 inline-block ${EMAIL_STATUS_COLORS[c.email_status] || "bg-slate-100 text-slate-500"}`}>
                        {c.email_status}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-300 text-xs">Not found yet</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <PriorityBadge priority={c.priority} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500">
            Page {page} · {total.toLocaleString()} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-xs border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-100"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-xs text-slate-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 text-xs border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-100"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
