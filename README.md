# surco-ia-web

UI mínima M5 para productores — React + Vite.

## Pantallas

- Login (auth local)
- Dashboard con accesos rápidos
- Cargar gasto / ingreso (finance, ARS o USD)
- Inventario (stock)
- Usuarios del tenant (tenant_owner)

## Desarrollo local

```bash
npm install
npm run dev
```

Vite proxyea `/api` → `http://127.0.0.1:8080` (gateway kind).

## Build imagen

```bash
cd surco-ia
make m5-build
```
