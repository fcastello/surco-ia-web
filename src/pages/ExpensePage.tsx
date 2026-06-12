import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { postExpense, SurcoApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function ExpensePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.token || !session.activeTenantId) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await postExpense(session.token, session.activeTenantId, {
        amount: parseFloat(amount),
        currency,
        description,
      });
      setSuccess("Gasto registrado correctamente.");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(err instanceof SurcoApiError ? err.message : "Error al cargar gasto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Cargar gasto</h1>
      <form className="card form-card" onSubmit={onSubmit}>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <label>
          Monto
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        <label>
          Moneda
          <select value={currency} onChange={(e) => setCurrency(e.target.value as "ARS" | "USD")}>
            <option value="ARS">ARS — Pesos</option>
            <option value="USD">USD — Dólares</option>
          </select>
        </label>
        <label>
          Descripción
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. combustible, fertilizante"
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Guardando…" : "Registrar gasto"}
        </button>
      </form>
    </div>
  );
}
