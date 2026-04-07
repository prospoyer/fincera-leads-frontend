import { NavLink } from "react-router-dom";

const nav = [
  { to: "/",         label: "Dashboard",     icon: "📊" },
  { to: "/orgs",     label: "Organizations", icon: "🏢" },
  { to: "/contacts", label: "Contacts",      icon: "👤" },
  { to: "/pipeline", label: "Pipeline",      icon: "⚙️"  },
];

export default function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700">
          <p className="text-white font-bold text-lg tracking-tight">Fincera</p>
          <p className="text-slate-400 text-xs mt-0.5">Lead Generation</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ` +
                (isActive
                  ? "bg-brand-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white")
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-slate-700">
          <p className="text-slate-500 text-xs">Built for Hamza Khan</p>
          <p className="text-slate-600 text-xs">finceraaccounting.com</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}
