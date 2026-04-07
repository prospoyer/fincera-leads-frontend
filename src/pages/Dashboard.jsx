import { useEffect, useState } from "react";
import { getStats, exportCsv } from "../api/client";

function StatCard({ label, value, sub, color = "brand" }) {
  const colors = {
    brand:  "bg-brand-600 text-white",
    green:  "bg-emerald-500 text-white",
    amber:  "bg-amber-500 text-white",
    slate:  "bg-slate-700 text-white",
  };
  return (
    <div className={`rounded-xl p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? "—"}</p>
      {sub && <p className="text-sm opacity-70 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (!stats)  return <div className="p-8 text-red-500">Failed to load stats.</div>;

  const fmt = (n) => (n ?? 0).toLocaleString();

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Nonprofit lead pipeline — $1M–$5M revenue, senior contacts only
          </p>
        </div>
        <a
          href={exportCsv()}
          className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          Export CSV
        </a>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Organizations"
          value={fmt(stats.total_orgs)}
          sub="in $1M–$5M range"
          color="slate"
        />
        <StatCard
          label="Contacts"
          value={fmt(stats.total_contacts)}
          sub="senior titles only"
          color="brand"
        />
        <StatCard
          label="Emails Found"
          value={fmt(stats.contacts_with_email)}
          sub={`${stats.email_coverage_pct}% coverage`}
          color="green"
        />
        <StatCard
          label="Property Owners"
          value={fmt(stats.has_property_orgs)}
          sub="real estate signal"
          color="amber"
        />
      </div>

      {/* Email breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          Email Status Breakdown
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Verified (SMTP)", value: stats.verified_emails, color: "text-emerald-600" },
            { label: "Found (website)", value: stats.found_emails,    color: "text-brand-600" },
            { label: "Guessed",         value: stats.guessed_emails,  color: "text-amber-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className={`text-2xl font-bold ${color}`}>{fmt(value)}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By state */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Top States
          </h2>
          <div className="space-y-2">
            {(stats.orgs_by_state || []).slice(0, 10).map(({ state, count }) => (
              <div key={state} className="flex items-center gap-3">
                <span className="w-8 text-xs font-bold text-slate-500">{state}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full"
                    style={{
                      width: `${Math.round((count / (stats.orgs_by_state[0]?.count || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-slate-600 w-10 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By title */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Top Contact Titles
          </h2>
          <div className="space-y-2">
            {(stats.top_titles || []).slice(0, 10).map(({ title, count }) => (
              <div key={title} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 truncate max-w-[75%]">{title}</span>
                <span className="font-semibold text-slate-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
