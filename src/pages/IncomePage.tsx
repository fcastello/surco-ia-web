import { Link, useNavigate } from "react-router-dom";
import { postIncome } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { FinanceTransactionForm } from "../components/FinanceTransactionForm";

export function IncomePage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <nav className="breadcrumb" aria-label="Miga de pan">
        <Link to="/">Inicio</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/ingresos">Ingresos</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Nuevo</span>
      </nav>
      <FinanceTransactionForm
        title="Cargar ingreso"
        submitLabel="Registrar ingreso"
        descriptionPlaceholder="Ej. venta de granos"
        successMessage="Ingreso registrado correctamente."
        onSuccessNavigate={() => navigate("/ingresos")}
        onSubmit={async (body) => {
          if (!session?.token || !session.activeTenantId) {
            throw new Error("Sesión inválida");
          }
          await postIncome(session.token, session.activeTenantId, body);
        }}
      />
    </>
  );
}
