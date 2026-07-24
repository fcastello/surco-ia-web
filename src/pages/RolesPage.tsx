import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  createRole,
  deleteRole,
  listRoles,
  updateRole,
  type TenantRole,
  SurcoApiError,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { canManageUsers, PERMISSION_GROUPS, permissionCode } from "../lib/permissions";

function emptySelection(): Set<string> {
  return new Set();
}

export function RolesPage() {
  const { session, activeTenant } = useAuth();
  const perms = activeTenant?.permissions;
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<TenantRole | null>(null);
  const [creating, setCreating] = useState(false);
  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(emptySelection);
  const [saving, setSaving] = useState(false);

  if (!canManageUsers(perms)) {
    return <Navigate to="/" replace />;
  }

  function reload() {
    if (!session?.token || !session.activeTenantId) return;
    listRoles(session.token, session.activeTenantId)
      .then((r) => setRoles(r.roles ?? []))
      .catch((e) => setError(e instanceof SurcoApiError ? e.message : "Error"));
  }

  useEffect(reload, [session?.token, session?.activeTenantId]);

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setSlug("");
    setDisplayName("");
    setSelected(emptySelection());
    setError("");
    setNotice("");
  }

  function startEdit(role: TenantRole) {
    if (role.is_system) return;
    setCreating(false);
    setEditing(role);
    setSlug(role.slug);
    setDisplayName(role.display_name);
    setSelected(new Set(role.permissions));
    setError("");
    setNotice("");
  }

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!session?.token || !session.activeTenantId) return;
    setSaving(true);
    setError("");
    try {
      const body = {
        display_name: displayName,
        permissions: Array.from(selected),
      };
      if (creating) {
        await createRole(session.token, session.activeTenantId, {
          slug,
          ...body,
        });
        setNotice("Rol creado. Los usuarios deben volver a iniciar sesión para aplicar permisos.");
      } else if (editing) {
        await updateRole(session.token, session.activeTenantId, editing.slug, body);
        setNotice("Rol actualizado. Re-login de usuarios afectados para aplicar cambios.");
      }
      setCreating(false);
      setEditing(null);
      reload();
    } catch (err) {
      setError(err instanceof SurcoApiError ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(role: TenantRole) {
    if (!session?.token || !session.activeTenantId || role.is_system) return;
    if (!confirm(`¿Eliminar el rol «${role.display_name}»?`)) return;
    try {
      await deleteRole(session.token, session.activeTenantId, role.slug);
      setNotice("Rol eliminado.");
      reload();
    } catch (err) {
      setError(err instanceof SurcoApiError ? err.message : "Error al eliminar");
    }
  }

  const showForm = creating || editing;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Roles y permisos</h1>
        <button type="button" className="btn btn-primary" onClick={startCreate}>
          Nuevo rol
        </button>
      </div>
      <p className="muted">
        Propietario y Miembro son fijos. Podés crear roles custom (p.ej. Asistente) con permisos
        por sección. Tras cambiar un rol, el usuario debe volver a iniciar sesión.
      </p>
      {error && <p className="error">{error}</p>}
      {notice && <p className="success">{notice}</p>}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Tipo</th>
              <th>Permisos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.slug}>
                <td>{r.display_name}</td>
                <td>
                  <code>{r.slug}</code>
                </td>
                <td>{r.is_system ? "Sistema" : "Custom"}</td>
                <td>{r.permissions?.length ?? 0}</td>
                <td className="row-actions">
                  {!r.is_system && (
                    <>
                      <button
                        type="button"
                        className="btn btn-small btn-secondary"
                        onClick={() => startEdit(r)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => void onDelete(r)}
                      >
                        Borrar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <form className="card form-card" onSubmit={onSave}>
          <h2>{creating ? "Nuevo rol" : `Editar «${editing?.display_name}»`}</h2>
          {creating && (
            <label>
              Slug (id técnico)
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="asistente"
                required
                pattern="[a-z][a-z0-9_]{1,62}"
              />
            </label>
          )}
          <label>
            Nombre visible
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Asistente"
              required
            />
          </label>

          <div className="perm-matrix">
            {PERMISSION_GROUPS.map((group) => (
              <fieldset key={group.resource} className="perm-group">
                <legend>{group.title}</legend>
                {group.actions.map((action) =>
                  action.scoped ? (
                    <div key={action.key} className="perm-row">
                      <span>{action.label}</span>
                      <label className="perm-check">
                        <input
                          type="checkbox"
                          checked={selected.has(permissionCode(group.resource, action.key, "own"))}
                          onChange={() =>
                            toggle(permissionCode(group.resource, action.key, "own"))
                          }
                        />
                        Solo propios
                      </label>
                      <label className="perm-check">
                        <input
                          type="checkbox"
                          checked={selected.has(permissionCode(group.resource, action.key, "all"))}
                          onChange={() =>
                            toggle(permissionCode(group.resource, action.key, "all"))
                          }
                        />
                        Todos
                      </label>
                    </div>
                  ) : (
                    <label key={action.key} className="perm-check">
                      <input
                        type="checkbox"
                        checked={selected.has(permissionCode(group.resource, action.key))}
                        onChange={() => toggle(permissionCode(group.resource, action.key))}
                      />
                      {action.label}
                    </label>
                  ),
                )}
              </fieldset>
            ))}
            <fieldset className="perm-group">
              <legend>Administración</legend>
              <label className="perm-check">
                <input
                  type="checkbox"
                  checked={selected.has("users:manage")}
                  onChange={() => toggle("users:manage")}
                />
                Gestionar usuarios y roles
              </label>
            </fieldset>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <p className="muted">
        <Link to="/usuarios">← Volver a usuarios</Link>
      </p>
    </div>
  );
}
