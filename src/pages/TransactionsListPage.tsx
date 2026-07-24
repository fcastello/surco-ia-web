import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  listFinanceTransactions,
  updateFinanceTransaction,
  type FinanceEntry,
  SurcoApiError,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { CategorySelect } from "../components/CategorySelect";

type Props = {
  entryType: "expense" | "income";
  title: string;
  createPath: string;
  createLabel: string;
  emptyMessage: string;
};

type EditForm = {
  id: number;
  occurredAt: string;
  description: string;
  currency: "ARS" | "USD";
  amount: string;
  exchangeRate: string;
  categoryId: number | null;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR");
}

function formatMoney(n: number, currency: string): string {
  return `${n.toLocaleString("es-AR", { maximumFractionDigits: 2 })} ${currency}`;
}

function isoToDateInput(iso: string): string {
  return iso.slice(0, 10);
}

export function TransactionsListPage({
  entryType,
  title,
  createPath,
  createLabel,
  emptyMessage,
}: Props) {
  const { session } = useAuth();
  const [rows, setRows] = useState<FinanceEntry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  function loadRows() {
    if (!session?.token || !session.activeTenantId) return;
    setLoading(true);
    listFinanceTransactions(session.token, session.activeTenantId)
      .then((r) => setRows(r.transactions ?? []))
      .catch((e) => setError(e instanceof SurcoApiError ? e.message : "Error"))
      .finally(() => setLoading(false));
  }

  useEffect(loadRows, [session?.token, session?.activeTenantId]);

  const filtered = useMemo(
    () => rows.filter((t) => t.entry_type === entryType),
    [rows, entryType],
  );

  function startEdit(row: FinanceEntry) {
    setNotice("");
    setEditError("");
    setEdit({
      id: row.id,
      occurredAt: isoToDateInput(row.occurred_at),
      description: row.description,
      currency: row.currency === "USD" ? "USD" : "ARS",
      amount: String(row.amount),
      exchangeRate: String(row.exchange_rate),
      categoryId: row.category_id ?? null,
    });
  }

  const editPreview = useMemo(() => {
    if (!edit) return null;
    const amt = parseFloat(edit.amount);
    const rate = parseFloat(edit.exchangeRate);
    if (!(amt > 0) || !(rate > 0)) return null;
    return edit.currency === "ARS"
      ? { ars: amt, usd: amt / rate }
      : { ars: amt * rate, usd: amt };
  }, [edit]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!edit || !session?.token || !session.activeTenantId) return;
    setEditError("");
    const amount = parseFloat(edit.amount);
    const rate = parseFloat(edit.exchangeRate);
    if (!(amount > 0)) {
      setEditError("Ingresá un monto válido.");
      return;
    }
    if (!(rate > 0)) {
      setEditError("Ingresá un tipo de cambio USD/ARS válido.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(edit.occurredAt)) {
      setEditError("Ingresá una fecha válida.");
      return;
    }
    setSaving(true);
    try {
      await updateFinanceTransaction(session.token, session.activeTenantId, edit.id, {
        amount,
        currency: edit.currency,
        description: edit.description,
        exchange_rate: rate,
        occurred_at: edit.occurredAt,
        category_id: edit.categoryId,
      });
      setEdit(null);
      setNotice("Cambios guardados.");
      loadRows();
    } catch (err) {
      setEditError(err instanceof SurcoApiError ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{title}</h1>
        <Link to={createPath} className="btn btn-primary">
          {createLabel}
        </Link>
      </div>

      {loading && <p className="muted">Cargando…</p>}
      {error && <p className="error">{error}</p>}
      {notice && <p className="success">{notice}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="notice">{emptyMessage}</p>
      )}

      {edit && (
        <form className="card form-card" onSubmit={handleSave}>
          <h2>Editar registro #{edit.id}</h2>
          {editError && <p className="error">{editError}</p>}
          <label>
            Fecha
            <input
              type="date"
              value={edit.occurredAt}
              onChange={(e) => setEdit({ ...edit, occurredAt: e.target.value })}
              required
            />
          </label>
          <label>
            Monto
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={edit.amount}
              onChange={(e) => setEdit({ ...edit, amount: e.target.value })}
              required
            />
          </label>
          <label>
            Moneda
            <select
              value={edit.currency}
              onChange={(e) =>
                setEdit({ ...edit, currency: e.target.value as "ARS" | "USD" })
              }
            >
              <option value="ARS">ARS — Pesos</option>
              <option value="USD">USD — Dólares</option>
            </select>
          </label>
          <label>
            Tipo de cambio USD → ARS
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={edit.exchangeRate}
              onChange={(e) => setEdit({ ...edit, exchangeRate: e.target.value })}
              required
            />
          </label>
          {editPreview && (
            <p className="muted fx-preview">
              Al guardar queda congelado:{" "}
              <strong>
                {editPreview.ars.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                })}
              </strong>
              {" ≈ "}
              <strong>
                {editPreview.usd.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </strong>
            </p>
          )}
          {entryType === "expense" && (
            <CategorySelect
              value={edit.categoryId}
              onChange={(id) => setEdit({ ...edit, categoryId: id })}
            />
          )}
          <label>
            Descripción
            <input
              type="text"
              value={edit.description}
              onChange={(e) => setEdit({ ...edit, description: e.target.value })}
              required
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEdit(null)}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {filtered.length > 0 && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                {entryType === "expense" && <th>Categoría</th>}
                <th>Moneda</th>
                <th>Monto</th>
                <th>TC</th>
                <th>ARS</th>
                <th>USD</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.occurred_at)}</td>
                  <td>{row.description}</td>
                  {entryType === "expense" && (
                    <td>{row.category || <span className="muted">—</span>}</td>
                  )}
                  <td>{row.currency}</td>
                  <td>{formatMoney(row.amount, row.currency)}</td>
                  <td>{row.exchange_rate.toLocaleString("es-AR")}</td>
                  <td>{formatMoney(row.amount_ars, "ARS")}</td>
                  <td>{formatMoney(row.amount_usd, "USD")}</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="btn btn-small btn-secondary"
                      onClick={() => startEdit(row)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ExpensesListPage() {
  return (
    <TransactionsListPage
      entryType="expense"
      title="Gastos"
      createPath="/gasto"
      createLabel="Cargar gasto"
      emptyMessage="No hay gastos registrados."
    />
  );
}

export function IncomesListPage() {
  return (
    <TransactionsListPage
      entryType="income"
      title="Ingresos"
      createPath="/ingreso"
      createLabel="Cargar ingreso"
      emptyMessage="No hay ingresos registrados."
    />
  );
}
