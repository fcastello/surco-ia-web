import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  addUser,
  deleteUser,
  listRoles,
  listUsers,
  patchUserRole,
  type TenantRole,
  SurcoApiError,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { canManageUsers } from "../lib/permissions";
import { roleLabel } from "../lib/roles";

export function UsersPage() {
  const { session, activeTenant } = useAuth();
  const [users, setUsers] = useState<{ email: string; role: string }[]>([]);
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!canManageUsers(activeTenant?.permissions)) {
    return <Navigate to="/" replace />;
  }

  function reload() {
    if (!session?.token || !session.activeTenantId) return;
    Promise.all([
      listUsers(session.token, session.activeTenantId),
      listRoles(session.token, session.activeTenantId),
    ])
      .then(([u, r]) => {
        setUsers(u.users ?? []);
        setRoles(r.roles ?? []);
      })
      .catch((e) => setError(e instanceof SurcoApiError ? e.message : "Error"));
  }

  useEffect(reload, [session?.token, session?.activeTenantId]);

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

  async function onChangeRole(userEmail: string, nextRole: string) {
    if (!session?.token || !session.activeTenantId) return;
    try {
      await patchUserRole(session.token, session.activeTenantId, userEmail, nextRole);
      setMessage(`Rol de ${userEmail} actualizado. Debe volver a iniciar sesión.`);
      reload();
    } catch (err) {
      setError(err instanceof SurcoApiError ? err.message : "Error");
    }
  }

  async function onRemove(userEmail: string) {
    if (!session?.token || !session.activeTenantId) return;
    if (!confirm(`¿Quitar a ${userEmail} del tenant?`)) return;
    try {
      await deleteUser(session.token, session.activeTenantId, userEmail);
      setMessage("Usuario quitado del tenant.");
      reload();
    } catch (err) {
      setError(err instanceof SurcoApiError ? err.message : "Error");
    }
  }

  function labelFor(slug: string): string {
    const r = roles.find((x) => x.slug === slug);
    return r?.display_name ?? roleLabel(slug);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Usuarios del tenant</h1>
        <Link to="/roles" className="btn btn-secondary">
          Roles y permisos
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Rol</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email}>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => void onChangeRole(u.email, e.target.value)}
                    aria-label={`Rol de ${u.email}`}
                  >
                    {roles.map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.display_name}
                      </option>
                    ))}
                    {!roles.some((r) => r.slug === u.role) && (
                      <option value={u.role}>{labelFor(u.role)}</option>
                    )}
                  </select>
                </td>
                <td className="row-actions">
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    onClick={() => void onRemove(u.email)}
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="card form-card" onSubmit={onSubmit}>
        <h2>Invitar usuario</h2>
        <p className="muted">El email debe estar registrado previamente en auth.</p>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Rol
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.display_name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Agregando…" : "Agregar"}
        </button>
      </form>
    </div>
  );
}
