import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  can,
  canManageUsers,
  canOwnOrAll,
} from "../lib/permissions";
import { roleLabel } from "../lib/roles";
import { BrandMark } from "./BrandMark";

function pathActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function routeAllowed(pathname: string, perms: string[] | undefined): boolean {
  if (pathname === "/" || pathname.startsWith("/login")) return true;
  if (pathname.startsWith("/gastos") || pathname.startsWith("/gasto")) {
    return canOwnOrAll(perms, "expenses", "read") || can(perms, "expenses:create");
  }
  if (pathname.startsWith("/ingresos") || pathname.startsWith("/ingreso")) {
    return canOwnOrAll(perms, "income", "read") || can(perms, "income:create");
  }
  if (pathname.startsWith("/inventario")) {
    return canOwnOrAll(perms, "inventory", "read") || can(perms, "inventory:create");
  }
  if (pathname.startsWith("/usuarios") || pathname.startsWith("/roles") || pathname.startsWith("/admin")) {
    return canManageUsers(perms);
  }
  return true;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { session, activeTenant, logout, setActiveTenantId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const perms = activeTenant?.permissions;
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!session || !activeTenant) return;
    if (!routeAllowed(location.pathname, perms)) {
      navigate("/", { replace: true });
    }
  }, [session, activeTenant, perms, location.pathname, navigate]);

  const opsNav = [
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
  ];

  const adminNav = [
    { to: "/usuarios", label: "Usuarios", show: canManageUsers(perms) },
    { to: "/roles", label: "Roles", show: canManageUsers(perms) },
  ].filter((i) => i.show);

  function onTenantChange(tenantId: string) {
    setActiveTenantId(tenantId);
  }

  const activeTenantInfo = session?.tenants.find(
    (t) => t.tenant_id === session.activeTenantId,
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="SurcoIA — inicio">
          <BrandMark />
          <span>SurcoIA</span>
        </Link>
        {session && session.tenants.length > 1 && (
          <select
            className="tenant-select"
            value={session.activeTenantId}
            onChange={(e) => onTenantChange(e.target.value)}
            aria-label="Tenant activo"
          >
            {session.tenants.map((t) => (
              <option key={t.tenant_id} value={t.tenant_id}>
                {t.tenant_id} ({roleLabel(t.role)})
              </option>
            ))}
          </select>
        )}
        {session && session.tenants.length === 1 && activeTenantInfo && (
          <span className="tenant-badge">
            {activeTenantInfo.tenant_id} · {roleLabel(activeTenantInfo.role)}
          </span>
        )}
        {session && (
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={navOpen}
            aria-controls="app-nav"
            onClick={() => setNavOpen((o) => !o)}
          >
            Menú
          </button>
        )}
        <div className="topbar-actions">
          <span className="user-email">{session?.user_id}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Salir
          </button>
        </div>
      </header>
      {session && (
        <nav id="app-nav" className={navOpen ? "nav open" : "nav"}>
          {opsNav
            .filter((item) => item.show)
            .map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={pathActive(location.pathname, item.to) ? "nav-link active" : "nav-link"}
              >
                {item.label}
              </Link>
            ))}
          {adminNav.length > 0 && (
            <div className="nav-group">
              <span className="nav-group-label">Admin</span>
              {adminNav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={pathActive(location.pathname, item.to) ? "nav-link active" : "nav-link"}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
      )}
      <main className="main">{children}</main>
    </div>
  );
}
