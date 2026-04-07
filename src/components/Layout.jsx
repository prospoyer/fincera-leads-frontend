import { NavLink } from "react-router-dom";

const nav = [
  { to: "/",         label: "Dashboard",     icon: "▪" },
  { to: "/orgs",     label: "Organizations", icon: "▪" },
  { to: "/contacts", label: "Contacts",      icon: "▪" },
  { to: "/pipeline", label: "Pipeline",      icon: "▪" },
];

export default function Layout({ children }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0d1117" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: "#0a0e17",
        borderRight: "1px solid #1e2d3d",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Logo */}
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid #1e2d3d" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 8, height: 8,
              background: "var(--gold)",
              borderRadius: "50%",
              boxShadow: "0 0 8px var(--gold)",
            }} />
            <span className="syne" style={{ fontSize: 16, fontWeight: 700, color: "#e8edf5", letterSpacing: "-0.02em" }}>
              Fincera
            </span>
          </div>
          <p className="mono" style={{ fontSize: 10, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Lead Intelligence
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                fontFamily: "'DM Sans', sans-serif",
                color: isActive ? "var(--gold)" : "var(--text-secondary)",
                background: isActive ? "rgba(240,165,0,0.08)" : "transparent",
                border: isActive ? "1px solid rgba(240,165,0,0.15)" : "1px solid transparent",
                transition: "all 0.15s",
              })}
            >
              <span style={{
                width: 6, height: 6,
                borderRadius: "50%",
                background: "currentColor",
                flexShrink: 0,
                opacity: 0.8,
              }} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #1e2d3d" }}>
          <p className="mono" style={{ fontSize: 10, color: "#334155", letterSpacing: "0.05em" }}>
            HAMZA KHAN
          </p>
          <p className="mono" style={{ fontSize: 10, color: "#1e2d3d", marginTop: 2 }}>
            finceraaccounting.com
          </p>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto", background: "#0d1117" }}>
        {children}
      </main>
    </div>
  );
}
