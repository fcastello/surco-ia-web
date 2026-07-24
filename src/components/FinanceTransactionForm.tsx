import { FormEvent, useEffect, useMemo, useState } from "react";
import { getExchangeRate, SurcoApiError } from "../api/client";

type Currency = "ARS" | "USD";

type Props = {
  title: string;
  submitLabel: string;
  descriptionPlaceholder: string;
  successMessage: string;
  onSubmit: (body: {
    amount: number;
    currency: Currency;
    description: string;
    exchange_rate: number;
  }) => Promise<void>;
  onSuccessNavigate: () => void;
};

export function FinanceTransactionForm({
  title,
  submitLabel,
  descriptionPlaceholder,
  successMessage,
  onSubmit,
  onSuccessNavigate,
}: Props) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("ARS");
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
    setLoading(true);
    try {
      await onSubmit({
        amount: parseFloat(amount),
        currency,
        description,
        exchange_rate: rate,
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
