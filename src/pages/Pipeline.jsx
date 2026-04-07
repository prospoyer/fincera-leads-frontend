import { useEffect, useState, useRef } from "react";
import { getPipelineRuns, getPipelineStatus, triggerPipeline } from "../api/client";

const STAGES = [
  { id: "discover", label: "Stage 1 — Discover",     desc: "Pull nonprofits from ProPublica API (all 50 states)" },
  { id: "enrich",   label: "Stage 2 — Enrich",       desc: "Download IRS 990 XML, extract officer names + titles + revenue" },
  { id: "scrape",   label: "Stage 3 — Scrape",       desc: "Visit org websites, extract emails from contact/team pages" },
  { id: "emails",   label: "Stage 4 — Email Finding", desc: "Pattern-guess + SMTP verify emails for remaining contacts" },
  { id: "export",   label: "Stage 5 — Export",        desc: "Write leads_export.csv (sorted by priority + revenue)" },
  { id: "all",      label: "Full Pipeline",           desc: "Run all stages in sequence (may take several hours)" },
];

const STATUS_COLORS = {
  running:   "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed:    "bg-red-100 text-red-700",
};

function formatDuration(s) {
  if (!s) return "—";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export default function Pipeline() {
  const [runs, setRuns]         = useState([]);
  const [status, setStatus]     = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [error, setError]       = useState("");
  const pollRef                 = useRef(null);

  const fetchData = () => {
    getPipelineRuns().then((r) => setRuns(r.data));
    getPipelineStatus().then((r) => setStatus(r.data));
  };

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleTrigger = async (stage) => {
    setError("");
    setTriggering(true);
    try {
      await triggerPipeline(stage);
      fetchData();
    } catch (e) {
      setError(e.response?.data?.error || "Failed to start pipeline.");
    } finally {
      setTriggering(false);
    }
  };

  const isRunning = status?.status === "running";

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pipeline Control</h1>
        <p className="text-slate-500 text-sm mt-1">
          Run pipeline stages to discover and enrich leads. Status refreshes every 5s.
        </p>
      </div>

      {/* Current status */}
      {status && status.status && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-6 text-sm font-medium
          ${status.status === "running" ? "bg-blue-50 border border-blue-200" :
            status.status === "completed" ? "bg-emerald-50 border border-emerald-200" :
            "bg-slate-50 border border-slate-200"}`}>
          {status.status === "running" && (
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse flex-shrink-0" />
          )}
          <span>
            {status.status === "running"
              ? `Pipeline running: ${status.stage} …`
              : status.status === "completed"
              ? `Last run: ${status.stage} — completed`
              : "No pipeline running"}
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {/* Stage triggers */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mb-8">
        {STAGES.map((stage) => (
          <div key={stage.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium text-slate-800 text-sm">{stage.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stage.desc}</p>
            </div>
            <button
              onClick={() => handleTrigger(stage.id)}
              disabled={isRunning || triggering}
              className={`ml-6 px-4 py-2 text-xs font-medium rounded-lg transition-colors flex-shrink-0
                ${stage.id === "all"
                  ? "bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-40"
                  : "bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40"
                }`}
            >
              {triggering ? "Starting…" : "Run"}
            </button>
          </div>
        ))}
      </div>

      {/* Run history */}
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
        Recent Runs
      </h2>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Stage</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Started</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Duration</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Orgs Found</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                  No runs yet. Trigger a stage above to start.
                </td>
              </tr>
            ) : runs.map((run) => (
              <tr key={run.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800 capitalize">{run.stage}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[run.status] || "bg-slate-100 text-slate-500"}`}>
                    {run.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {new Date(run.started_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-slate-600 text-xs">
                  {formatDuration(run.duration_seconds)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-700">
                  {run.orgs_found?.toLocaleString() || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
