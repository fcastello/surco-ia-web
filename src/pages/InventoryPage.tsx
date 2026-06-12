import { useEffect, useState } from "react";
import { getStock, type StockRow, SurcoApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function InventoryPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<StockRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.token || !session.activeTenantId) return;
    setLoading(true);
    getStock(session.token, session.activeTenantId)
      .then((r) => setItems(r.items ?? []))
      .catch((e) => setError(e instanceof SurcoApiError ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="page">
      <h1>Inventario</h1>
      {loading && <p className="muted">Cargando stock…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="notice">Sin ítems registrados. Usá la API o cargá insumos desde operaciones.</p>
      )}
      {items.length > 0 && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.sku}>
                  <td><code>{row.sku}</code></td>
                  <td>{row.name}</td>
                  <td>
                    {row.quantity.toLocaleString("es-AR")} {row.unit}
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
