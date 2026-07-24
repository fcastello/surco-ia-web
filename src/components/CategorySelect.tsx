import { useEffect, useState } from "react";
import {
  createFinanceCategory,
  listFinanceCategories,
  type FinanceCategory,
  SurcoApiError,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";

type Props = {
  value: number | null;
  onChange: (id: number | null) => void;
};

export function CategorySelect({ value, onChange }: Props) {
  const { session } = useAuth();
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.token || !session.activeTenantId) return;
    listFinanceCategories(session.token, session.activeTenantId)
      .then((r) => setCategories(r.categories ?? []))
      .catch(() => setError("No se pudieron cargar las categorías."));
  }, [session?.token, session?.activeTenantId]);

  async function handleCreate() {
    if (!session?.token || !session.activeTenantId) return;
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    setError("");
    try {
      const res = await createFinanceCategory(session.token, session.activeTenantId, name);
      setCategories((prev) =>
        [...prev, res.category].sort((a, b) => a.name.localeCompare(b.name, "es")),
      );
      onChange(res.category.id);
      setNewName("");
      setCreating(false);
    } catch (err) {
      setError(err instanceof SurcoApiError ? err.message : "Error al crear la categoría");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="category-select">
      <label>
        Categoría
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        >
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {!creating ? (
        <button type="button" className="linkish" onClick={() => setCreating(true)}>
          + Nueva categoría
        </button>
      ) : (
        <div className="category-create">
          <input
            type="text"
            value={newName}
            placeholder="Nombre de la categoría"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCreate();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-small btn-secondary"
            onClick={() => void handleCreate()}
            disabled={saving || !newName.trim()}
          >
            {saving ? "Creando…" : "Crear"}
          </button>
          <button
            type="button"
            className="btn btn-small btn-secondary"
            onClick={() => {
              setCreating(false);
              setNewName("");
            }}
          >
            Cancelar
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
