# AGENTS.md — Contexto para LLMs (surco-ia-web)

SPA React + Vite (M5): UI del productor contra el gateway (`/api/*`).

**Platform:** [surco-ia/AGENTS.md](https://github.com/fcastello/surco-ia/blob/main/AGENTS.md)

## Stack

- React, React Router, Vite
- Sesión en `localStorage` (`surco.session`): token + tenants (con `role` y **`permissions`**)
- Client: `src/api/client.ts`

## Rutas / pantallas

| Ruta | Uso | Gate tipico |
|------|-----|-------------|
| `/login` | Auth | público |
| `/` | Dashboard + resumen | permisos read |
| `/gasto` → `/gastos/nuevo`, `/gastos` | Alta / tabla gastos | `expenses:*` |
| `/ingreso` → `/ingresos/nuevo`, `/ingresos` | Alta / tabla ingresos | `income:*` |
| `/inventario` | ABM ítems + movimientos | `inventory:*` |
| `/usuarios` | Membresías + asignar rol | `users:manage` |
| `/roles` | Matriz de permisos / roles custom | `users:manage` |

Helpers: `src/lib/permissions.ts` (`satisfies`, `can`, `canOwnOrAll`, …), `src/lib/roles.ts` (labels ES).

## Comportamiento permisos

- Nav y acciones del dashboard ocultas sin permiso
- Tablas: editar/borrar solo si `:all` o (`:own` y `created_by === user_id`)
- Tras cambiar roles en otra sesión → **re-login** para refrescar JWT/permissions

## Lab

- kind: http://127.0.0.1:8080 (`make gateway-forward` si hace falta)
- Pi Compose: http://r4-4g-2:8080
- Dev: `owner@cabrera.local` / `SurcoDev2026!`

## Reglas

- No hardcodear roles en inglés en UI (usar labels)
- No confiar solo en UI: el backend enforcea permisos
- Seguir estilos existentes en `index.css` (sin rediseñar el sistema visual)
