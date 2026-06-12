import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { addUser, listUsers, SurcoApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function UsersPage() {
  const { session, activeTenant } = useAuth();
  const [users, setUsers] = useState<{ email: string; role: string }[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (activeTenant?.role !== "tenant_owner") {
    return <Navigate to="/" replace />;
  }

  function reload() {
    if (!session?.token || !session.activeTenantId) return;
    listUsers(session.token, session.activeTenantId)
      .then((r) => setUsers(r.users ?? []))
      .catch((e) => setError(e instanceof SurcoApiError ? e.message : "Error"));
  }

  useEffect(() => {
    reload();
  }, [session?.token, session?.activeTenantId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.token || !session.activeTenantId) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await addUser(session.token, session.activeTenantId, { email, role });
      setMessage("Usuario agregado al tenant.");
      setEmail("");
      reload();
    } catch (err) {
      setError(err instanceof SurcoApiError ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Usuarios del tenant</h1>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email}>
                <td>{u.email}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="card form-card" onSubmit={onSubmit}>
        <h2>Invitar usuario</h2>
        <p className="muted">El email debe estar registrado previamente en auth.</p>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Rol
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">member</option>
            <option value="tenant_owner">tenant_owner</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Agregando…" : "Agregar"}
        </button>
      </form>
    </div>
  );
}
