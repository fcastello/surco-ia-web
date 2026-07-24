import { useNavigate } from "react-router-dom";
import { postIncome } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { FinanceTransactionForm } from "../components/FinanceTransactionForm";

export function IncomePage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <FinanceTransactionForm
      title="Cargar ingreso"
      submitLabel="Registrar ingreso"
      descriptionPlaceholder="Ej. venta de granos"
      successMessage="Ingreso registrado correctamente."
      onSuccessNavigate={() => navigate("/")}
      onSubmit={async (body) => {
        if (!session?.token || !session.activeTenantId) {
          throw new Error("Sesión inválida");
        }
        await postIncome(session.token, session.activeTenantId, body);
      }}
    />
  );
}
