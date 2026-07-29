import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RequirePermission } from "./components/RequirePermission";
import { DashboardPage } from "./pages/DashboardPage";
import { ExpensePage } from "./pages/ExpensePage";
import { IncomePage } from "./pages/IncomePage";
import { InventoryPage } from "./pages/InventoryPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import {
  ExpensesListPage,
  IncomesListPage,
} from "./pages/TransactionsListPage";
import { UsersPage } from "./pages/UsersPage";
import { RolesPage } from "./pages/RolesPage";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route
              element={
                <RequirePermission mode={{ kind: "resource", resource: "expenses", needCreate: true }} />
              }
            >
              <Route path="/gastos" element={<ExpensesListPage />} />
              <Route path="/gastos/nuevo" element={<ExpensePage />} />
            </Route>
            <Route
              element={
                <RequirePermission mode={{ kind: "resource", resource: "income", needCreate: true }} />
              }
            >
              <Route path="/ingresos" element={<IncomesListPage />} />
              <Route path="/ingresos/nuevo" element={<IncomePage />} />
            </Route>
            <Route
              element={
                <RequirePermission mode={{ kind: "resource", resource: "inventory", needCreate: true }} />
              }
            >
              <Route path="/inventario" element={<InventoryPage />} />
            </Route>
            <Route element={<RequirePermission mode={{ kind: "manage-users" }} />}>
              <Route path="/usuarios" element={<UsersPage />} />
              <Route path="/roles" element={<RolesPage />} />
            </Route>
            <Route path="/gasto" element={<Navigate to="/gastos/nuevo" replace />} />
            <Route path="/ingreso" element={<Navigate to="/ingresos/nuevo" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
