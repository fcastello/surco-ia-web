import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createInventoryItem,
  deleteInventoryItem,
  getStock,
  postInventoryMovement,
  updateInventoryItem,
  type StockRow,
  SurcoApiError,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";

type Mode = "idle" | "create" | "edit" | "move";

export function InventoryPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<StockRow[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("idle");
  const [selectedSku, setSelectedSku] = useState("");

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState("");
  const [ownerType, setOwnerType] = useState<"own" | "contractor">("own");
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => {
    if (!session?.token || !session.activeTenantId) return;
    setLoading(true);
    getStock(session.token, session.activeTenantId)
      .then((r) => setItems(r.items ?? []))
      .catch((e) => setError(e instanceof SurcoApiError ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [session?.token, session?.activeTenantId]);

  useEffect(() => {
    reload();
  }, [reload]);

  function resetForms() {
    setSku("");
    setName("");
    setUnit("kg");
    setDirection("in");
    setQuantity("");
    setOwnerType("own");
    setSelectedSku("");
    setMode("idle");
  }

  function startCreate() {
    setError("");
    setMessage("");
    setSku("");
    setName("");
    setUnit("kg");
    setMode("create");
  }

  function startEdit(row: StockRow) {
    setError("");
    setMessage("");
    setSelectedSku(row.sku);
    setName(row.name);
    setUnit(row.unit);
    setMode("edit");
  }

  function startMove(row: StockRow) {
    setError("");
    setMessage("");
    setSelectedSku(row.sku);
    setDirection("in");
    setQuantity("");
    setOwnerType("own");
    setMode("move");
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!session?.token || !session.activeTenantId) return;
    setSaving(true);
    setError("");
    try {
      await createInventoryItem(session.token, session.activeTenantId, {
        sku,
        name,
        unit,
      });
      setMessage(`Ítem ${sku} creado.`);
      resetForms();
      reload();
    } catch (err) {
      setError(err instanceof SurcoApiError ? err.message : "Error al crear");
    } finally {
      setSaving(false);
    }
  }

  async function onEdit(e: FormEvent) {
    e.preventDefault();
    if (!session?.token || !session.activeTenantId || !selectedSku) return;
    setSaving(true);
    setError("");
    try {
      await updateInventoryItem(session.token, session.activeTenantId, selectedSku, {
        name,
        unit,
      });
      setMessage(`Ítem ${selectedSku} actualizado.`);
      resetForms();
      reload();
    } catch (err) {
      setError(err instanceof SurcoApiError ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: StockRow) {
    if (!session?.token || !session.activeTenantId) return;
    if (!window.confirm(`¿Eliminar el ítem ${row.sku}? Solo si el stock es 0.`)) return;
    setError("");
    setMessage("");
    try {
      await deleteInventoryItem(session.token, session.activeTenantId, row.sku);
      setMessage(`Ítem ${row.sku} eliminado.`);
      if (selectedSku === row.sku) resetForms();
      reload();
    } catch (err) {
      setError(err instanceof SurcoApiError ? err.message : "Error al eliminar");
    }
  }

  async function onMove(e: FormEvent) {
    e.preventDefault();
    if (!session?.token || !session.activeTenantId || !selectedSku) return;
    setSaving(true);
    setError("");
    try {
      await postInventoryMovement(session.token, session.activeTenantId, {
        sku: selectedSku,
        direction,
        quantity: parseFloat(quantity),
        metadata: { owner_type: ownerType },
      });
      setMessage(
        direction === "in"
          ? `Entrada registrada en ${selectedSku}.`
          : `Salida registrada en ${selectedSku}.`,
      );
      resetForms();
      reload();
    } catch (err) {
      setError(err instanceof SurcoApiError ? err.message : "Error en movimiento");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Inventario</h1>
        <button type="button" className="btn btn-primary" onClick={startCreate}>
          Nuevo ítem
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      {loading && <p className="muted">Cargando stock…</p>}

      {!loading && items.length === 0 && mode === "idle" && (
        <p className="notice">Sin ítems. Creá el primero con «Nuevo ítem».</p>
      )}

      {items.length > 0 && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.sku}>
                  <td>
                    <code>{row.sku}</code>
                  </td>
                  <td>{row.name}</td>
                  <td>
                    {row.quantity.toLocaleString("es-AR")} {row.unit}
                  </td>
                  <td className="row-actions">
                    <button type="button" className="btn btn-small" onClick={() => startMove(row)}>
                      Movimiento
                    </button>
                    <button type="button" className="btn btn-small" onClick={() => startEdit(row)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => void onDelete(row)}
                      disabled={row.quantity !== 0}
                      title={
                        row.quantity !== 0
                          ? "Solo se puede eliminar con stock 0"
                          : "Eliminar ítem"
                      }
                    >
                      Baja
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mode === "create" && (
        <form className="card form-card" onSubmit={onCreate}>
          <h2>Nuevo ítem</h2>
          <label>
            SKU
            <input value={sku} onChange={(e) => setSku(e.target.value)} required />
          </label>
          <label>
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Unidad
            <input value={unit} onChange={(e) => setUnit(e.target.value)} required />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Guardando…" : "Crear"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForms}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {mode === "edit" && (
        <form className="card form-card" onSubmit={onEdit}>
          <h2>Editar {selectedSku}</h2>
          <label>
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Unidad
            <input value={unit} onChange={(e) => setUnit(e.target.value)} required />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForms}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {mode === "move" && (
        <form className="card form-card" onSubmit={onMove}>
          <h2>Movimiento — {selectedSku}</h2>
          <label>
            Tipo
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as "in" | "out")}
            >
              <option value="in">Entrada</option>
              <option value="out">Salida</option>
            </select>
          </label>
          <label>
            Cantidad
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </label>
          <label>
            Origen / destino
            <select
              value={ownerType}
              onChange={(e) => setOwnerType(e.target.value as "own" | "contractor")}
            >
              <option value="own">Propio</option>
              <option value="contractor">Contratista</option>
            </select>
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Guardando…" : "Registrar"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForms}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
