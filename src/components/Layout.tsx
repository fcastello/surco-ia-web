import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  can,
  canManageUsers,
  canOwnOrAll,
} from "../lib/permissions";
import { roleLabel } from "../lib/roles";

export function Layout({ children }: { children: React.ReactNode }) {
  const { session, activeTenant, logout, setActiveTenantId } = useAuth();
  const location = useLocation();
  const perms = activeTenant?.permissions;

  const nav = [
    { to: "/", label: "Inicio", show: true },
    {
      to: "/gastos",
      label: "Gastos",
      show: canOwnOrAll(perms, "expenses", "read") || can(perms, "expenses:create"),
    },
    {
      to: "/ingresos",
      label: "Ingresos",
      show: canOwnOrAll(perms, "income", "read") || can(perms, "income:create"),
    },
    {
      to: "/inventario",
      label: "Inventario",
      show: canOwnOrAll(perms, "inventory", "read") || can(perms, "inventory:create"),
    },
    { to: "/usuarios", label: "Usuarios", show: canManageUsers(perms) },
    { to: "/roles", label: "Roles", show: canManageUsers(perms) },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <span>SurcoIA</span>
        </div>
        {session && session.tenants.length > 1 && (
          <select
            className="tenant-select"
            value={session.activeTenantId}
            onChange={(e) => setActiveTenantId(e.target.value)}
            aria-label="Tenant activo"
          >
            {session.tenants.map((t) => (
              <option key={t.tenant_id} value={t.tenant_id}>
                {t.tenant_id} ({roleLabel(t.role)})
              </option>
            ))}
          </select>
        )}
        {session && session.tenants.length === 1 && (
          <span className="tenant-badge">{session.activeTenantId}</span>
        )}
        <div className="topbar-actions">
          <span className="user-email">{session?.user_id}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Salir
          </button>
        </div>
      </header>
      {session && (
        <nav className="nav">
          {nav
            .filter((item) => item.show)
            .map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={location.pathname === item.to ? "nav-link active" : "nav-link"}
              >
                {item.label}
              </Link>
            ))}
        </nav>
      )}
      <main className="main">{children}</main>
    </div>
  );
}
