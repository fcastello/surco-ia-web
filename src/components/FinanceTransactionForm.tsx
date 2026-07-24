import { FormEvent, useEffect, useMemo, useState } from "react";
import { getExchangeRate, SurcoApiError } from "../api/client";
import { CategorySelect } from "./CategorySelect";

type Currency = "ARS" | "USD";

function todayLocalISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = {
  title: string;
  submitLabel: string;
  descriptionPlaceholder: string;
  successMessage: string;
  /** Muestra el selector de categoría (gastos). */
  withCategory?: boolean;
  onSubmit: (body: {
    amount: number;
    currency: Currency;
    description: string;
    exchange_rate: number;
    occurred_at: string;
    category_id: number | null;
  }) => Promise<void>;
  onSuccessNavigate: () => void;
};

export function FinanceTransactionForm({
  title,
  submitLabel,
  descriptionPlaceholder,
  successMessage,
  withCategory = false,
  onSubmit,
  onSuccessNavigate,
}: Props) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("ARS");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [occurredAt, setOccurredAt] = useState(todayLocalISODate);
  const [description, setDescription] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [rateSource, setRateSource] = useState("");
  const [rateLoading, setRateLoading] = useState(true);
  const [rateError, setRateError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadRate() {
    setRateLoading(true);
    setRateError("");
    try {
      const res = await getExchangeRate("USD");
      setExchangeRate(String(res.rate_ars));
      setRateSource(res.source);
    } catch (err) {
      setRateError(
        err instanceof SurcoApiError
          ? err.message
          : "No se pudo obtener el tipo de cambio; ingresalo manualmente.",
      );
    } finally {
      setRateLoading(false);
    }
  }

  useEffect(() => {
    void loadRate();
  }, []);

  const preview = useMemo(() => {
    const amt = parseFloat(amount);
    const rate = parseFloat(exchangeRate);
    if (!(amt > 0) || !(rate > 0)) return null;
    if (currency === "ARS") {
      return { ars: amt, usd: amt / rate };
    }
    return { ars: amt * rate, usd: amt };
  }, [amount, currency, exchangeRate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const rate = parseFloat(exchangeRate);
    if (!(rate > 0)) {
      setError("Ingresá un tipo de cambio USD/ARS válido.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredAt)) {
      setError("Ingresá una fecha válida.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        amount: parseFloat(amount),
        currency,
        description,
        exchange_rate: rate,
        occurred_at: occurredAt,
        category_id: categoryId,
      });
      setSuccess(successMessage);
      setTimeout(onSuccessNavigate, 1200);
    } catch (err) {
      setError(err instanceof SurcoApiError ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>{title}</h1>
      <form className="card form-card" onSubmit={handleSubmit}>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <label>
          Fecha
          <input
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            required
          />
        </label>
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
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
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
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            required
            disabled={rateLoading}
          />
        </label>
        <p className="muted fx-hint">
          {rateLoading
            ? "Obteniendo tipo de cambio del día…"
            : rateError
              ? rateError
              : `Sugerido del día (${rateSource}). Podés modificarlo antes de guardar.`}
          {!rateLoading && (
            <>
              {" "}
              <button type="button" className="linkish" onClick={() => void loadRate()}>
                Actualizar
              </button>
            </>
          )}
        </p>
        {preview && (
          <p className="muted fx-preview">
            Al guardar queda congelado:{" "}
            <strong>
              {preview.ars.toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS",
              })}
            </strong>
            {" ≈ "}
            <strong>
              {preview.usd.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </strong>
            {` (TC ${parseFloat(exchangeRate).toLocaleString("es-AR")})`}
          </p>
        )}
        {withCategory && (
          <CategorySelect value={categoryId} onChange={setCategoryId} />
        )}
        <label>
          Descripción
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={descriptionPlaceholder}
            required
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading || rateLoading}>
          {loading ? "Guardando…" : submitLabel}
        </button>
      </form>
    </div>
  );
}
