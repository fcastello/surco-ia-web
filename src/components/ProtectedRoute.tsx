import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Layout } from "../components/Layout";

export function ProtectedRoute() {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/login" replace />;
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
