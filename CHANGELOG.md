# Changelog

## [Unreleased]

_Nada pendiente._

## [0.1.2] - 2026-07-24

### Added

- ABM de inventario: alta, edición, baja (stock 0) y movimientos entrada/salida
- Tablas de gastos (`/gastos`) e ingresos (`/ingresos`) con fecha, monto, TC, ARS/USD
- Edición de gastos/ingresos desde la tabla (fecha, monto, moneda, TC, descripción)
- Categorías de gastos: selector en alta/edición con creación inline; columna en la tabla
- Nav actualizada: Gastos / Ingresos / Inventario

## [0.1.1] - 2026-07-24

### Added

- Formulario de gasto/ingreso: tipo de cambio del día (API) editable antes de guardar
- Preview ARS ≈ USD congelado al registrar
- `getExchangeRate` en el client API
- Campo fecha (`occurred_at`) en gasto/ingreso, default hoy
- Etiquetas de roles en español (Propietario / Miembro)

## [0.1.0] - 2026-06-12

### Added

- React + Vite: login, dashboard, gasto, ingreso, inventario, usuarios
- Selector de tenant multi-campo
- Imagen nginx estática para kind
