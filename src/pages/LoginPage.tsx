import { FormEvent, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { SurcoApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { BrandMark } from "../components/BrandMark";

type Props = {
  next?: string;
};

export function LoginPage({ next }: Props) {
  const { session, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("owner@cabrera.local");
  const [password, setPassword] = useState("SurcoDev2026!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dest =
    next ||
    (location.state as { from?: string } | null)?.from ||
    "/";
  const safeDest = dest.startsWith("/") && !dest.startsWith("//") ? dest : "/";

  if (session) {
    return <Navigate to={safeDest === "/login" ? "/" : safeDest} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof SurcoApiError ? err.message : "Error de login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={onSubmit}>
        <div className="login-brand">
          <BrandMark />
          <h1>SurcoIA</h1>
        </div>
        <p className="subtitle">Gestión del campo — login local</p>
        {error && <p className="error">{error}</p>}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
