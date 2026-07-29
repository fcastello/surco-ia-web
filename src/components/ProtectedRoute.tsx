import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Layout } from "../components/Layout";

export function ProtectedRoute() {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  if (!session.activeTenantId && session.tenants.length === 0) {
    return (
      <Layout>
        <p className="notice">Tu usuario no tiene tenants asignados.</p>
      </Layout>
    );
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
