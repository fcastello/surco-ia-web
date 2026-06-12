import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFinanceSummary, SurcoApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function DashboardPage() {
  const { session } = useAuth();
  const [summary, setSummary] = useState<{
    net_ars_at_close: number;
    net_usd_at_close: number;
    today_exchange_rate: number;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.token || !session.activeTenantId) return;
    getFinanceSummary(session.token, session.activeTenantId)
      .then((r) => setSummary(r.summary))
      .catch((e) => setError(e instanceof SurcoApiError ? e.message : "Error"));
  }, [session]);

  return (
    <div className="page">
      <h1>Inicio</h1>
      <p className="lead">Operaciones rápidas para el día en el campo.</p>
      <div className="action-grid">
        <Link to="/gasto" className="action-card expense">
          <span className="action-title">Cargar gasto</span>
          <span className="action-desc">Combustible, insumos, servicios</span>
        </Link>
        <Link to="/ingreso" className="action-card income">
          <span className="action-title">Cargar ingreso</span>
          <span className="action-desc">Ventas, cobros</span>
        </Link>
        <Link to="/inventario" className="action-card stock">
          <span className="action-title">Ver inventario</span>
          <span className="action-desc">Stock actual por insumo</span>
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
      {summary && (
        <section className="card summary-card">
          <h2>Resumen financiero</h2>
          <dl className="summary-dl">
            <div>
              <dt>Neto ARS (al cierre)</dt>
              <dd>{summary.net_ars_at_close.toLocaleString("es-AR")} ARS</dd>
            </div>
            <div>
              <dt>Neto USD (congelado)</dt>
              <dd>{summary.net_usd_at_close.toLocaleString("es-AR")} USD</dd>
            </div>
            <div>
              <dt>Tipo del día</dt>
              <dd>1 USD = {summary.today_exchange_rate.toLocaleString("es-AR")} ARS</dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
