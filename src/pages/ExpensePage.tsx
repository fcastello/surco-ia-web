import { Link, useNavigate } from "react-router-dom";
import { postExpense } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { FinanceTransactionForm } from "../components/FinanceTransactionForm";

export function ExpensePage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <nav className="breadcrumb" aria-label="Miga de pan">
        <Link to="/">Inicio</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/gastos">Gastos</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Nuevo</span>
      </nav>
      <FinanceTransactionForm
        title="Cargar gasto"
        submitLabel="Registrar gasto"
        withCategory
        descriptionPlaceholder="Ej. combustible, fertilizante"
        successMessage="Gasto registrado correctamente."
        onSuccessNavigate={() => navigate("/gastos")}
        onSubmit={async (body) => {
          if (!session?.token || !session.activeTenantId) {
            throw new Error("Sesión inválida");
          }
          await postExpense(session.token, session.activeTenantId, body);
        }}
      />
    </>
  );
}
