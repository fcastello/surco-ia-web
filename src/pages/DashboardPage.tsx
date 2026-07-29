import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFinanceSummary, SurcoApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { can, canOwnOrAll } from "../lib/permissions";

export function DashboardPage() {
  const { session, activeTenant } = useAuth();
  const perms = activeTenant?.permissions;
  const [summary, setSummary] = useState<{
    net_ars_at_close: number;
    net_usd_at_close: number;
    today_exchange_rate: number;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.token || !session.activeTenantId) return;
    if (!canOwnOrAll(perms, "expenses", "read") && !canOwnOrAll(perms, "income", "read")) {
      return;
    }
    getFinanceSummary(session.token, session.activeTenantId)
      .then((r) => setSummary(r.summary))
      .catch((e) => setError(e instanceof SurcoApiError ? e.message : "Error"));
  }, [session, perms]);

  return (
    <div className="page">
      <h1>Inicio</h1>
      <p className="lead">Operaciones rápidas para el día en el campo.</p>
      <div className="action-grid">
        {can(perms, "expenses:create") && (
          <Link to="/gastos/nuevo" className="action-card expense">
            <span className="action-title">Cargar gasto</span>
            <span className="action-desc">Combustible, insumos, servicios</span>
          </Link>
        )}
        {can(perms, "income:create") && (
          <Link to="/ingresos/nuevo" className="action-card income">
            <span className="action-title">Cargar ingreso</span>
            <span className="action-desc">Ventas, cobros</span>
          </Link>
        )}
        {canOwnOrAll(perms, "expenses", "read") && (
          <Link to="/gastos" className="action-card expense">
            <span className="action-title">Ver gastos</span>
            <span className="action-desc">Tabla con TC y equivalentes</span>
          </Link>
        )}
        {canOwnOrAll(perms, "income", "read") && (
          <Link to="/ingresos" className="action-card income">
            <span className="action-title">Ver ingresos</span>
            <span className="action-desc">Tabla con TC y equivalentes</span>
          </Link>
        )}
        {(canOwnOrAll(perms, "inventory", "read") || can(perms, "inventory:create")) && (
          <Link to="/inventario" className="action-card stock">
            <span className="action-title">Inventario</span>
            <span className="action-desc">ABM de ítems y movimientos</span>
          </Link>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      {summary && (
        <section className="card summary-card">
          <h2>Resumen financiero</h2>
          <dl className="summary-dl">
            <div>
              <dt>Neto ARS (al cierre)</dt>
              <dd
                className={
                  summary.net_ars_at_close >= 0
                    ? "amount-net-positive"
                    : "amount-net-negative"
                }
              >
                {summary.net_ars_at_close.toLocaleString("es-AR")} ARS
              </dd>
            </div>
            <div>
              <dt>Neto USD (congelado)</dt>
              <dd
                className={
                  summary.net_usd_at_close >= 0
                    ? "amount-net-positive"
                    : "amount-net-negative"
                }
              >
                {summary.net_usd_at_close.toLocaleString("es-AR")} USD
              </dd>
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
