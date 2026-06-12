# surco-ia-web

UI mínima M5 para productores — React + Vite.

## Pantallas

- Login (auth local)
- Dashboard con accesos rápidos
- Cargar gasto / ingreso (finance, ARS o USD)
- Inventario (stock)
- Usuarios del tenant (tenant_owner)

## Desarrollo local

### Contra gateway kind (recomendado)

```bash
cd ../surco-ia
make m5-build && make local-deploy
make gateway-forward    # otra terminal, si http://127.0.0.1:8080 da connection reset
```

Abrí http://127.0.0.1:8080 — login dev: `owner@cabrera.local` / `SurcoDev2026!`

### Solo frontend (Vite dev server)

```bash
npm install
npm run dev
```

Vite proxyea `/api` → `http://127.0.0.1:8080` (requiere gateway kind accesible o `make gateway-forward`).

## Build imagen

```bash
cd ../surco-ia
make m5-build
```
