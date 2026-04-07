import { useEffect, useState, useCallback } from "react";
import { getOrgs } from "../api/client";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

function Badge({ children, color = "slate" }) {
  const map = {
    slate:   "bg-slate-100 text-slate-600",
    green:   "bg-emerald-100 text-emerald-700",
    amber:   "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[color]}`}>
      {children}
    </span>
  );
}

export default function Orgs() {
  const [orgs, setOrgs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [search, setSearch]   = useState("");
  const [state, setState]     = useState("");
  const [property, setProperty] = useState("");

  const fetchOrgs = useCallback(() => {
    setLoading(true);
    const params = { page, page_size: 50 };
    if (search)   params.search       = search;
    if (state)    params.state        = state;
    if (property) params.has_property = property === "yes" ? "true" : "false";

    getOrgs(params)
      .then((r) => {
        setOrgs(r.data.results ?? r.data);
        setTotal(r.data.count ?? 0);
        setTotalPages(r.data.total_pages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, state, property]);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const fmt = (n) => n ? `$${(n / 1_000_000).toFixed(1)}M` : "—";

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
        <p className="text-slate-500 text-sm mt-1">{total.toLocaleString()} nonprofits in database</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or EIN…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={state}
          onChange={(e) => { setState(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All states</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={property}
          onChange={(e) => { setProperty(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Property: any</option>
          <option value="yes">Has property</option>
          <option value="no">No property</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Organization</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Location</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Revenue</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600">Contacts</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600">Property</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Website</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">Loading…</td></tr>
            ) : orgs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">No organizations found.</td></tr>
            ) : orgs.map((org) => (
              <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800 truncate max-w-[260px]">{org.name}</p>
                  <p className="text-xs text-slate-400">EIN {org.ein}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{org.city}, {org.state}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">{fmt(org.revenue)}</td>
                <td className="px-4 py-3 text-center">
                  <Badge color={org.contact_count > 0 ? "green" : "slate"}>
                    {org.contact_count}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  {org.has_property ? <Badge color="amber">Yes</Badge> : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  {org.website ? (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline text-xs truncate block max-w-[160px]"
                    >
                      {org.website.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
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
