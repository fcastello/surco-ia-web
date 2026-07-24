/** Helpers de permisos granulares (alineados a surco-ia-lib/auth/perm). */

export function satisfies(granted: string[] | undefined, required: string): boolean {
  if (!required) return true;
  const list = granted ?? [];
  if (list.includes(required)) return true;
  if (required.endsWith(":own")) {
    const all = required.slice(0, -4) + ":all";
    return list.includes(all);
  }
  return false;
}

export function can(granted: string[] | undefined, code: string): boolean {
  return satisfies(granted, code);
}

export function canAll(granted: string[] | undefined, resource: string, action: string): boolean {
  return satisfies(granted, `${resource}:${action}:all`);
}

export function canOwnOrAll(granted: string[] | undefined, resource: string, action: string): boolean {
  return satisfies(granted, `${resource}:${action}:own`);
}

export function canManageUsers(granted: string[] | undefined): boolean {
  return satisfies(granted, "users:manage");
}

/** Etiquetas ES para la matriz de permisos. */
export const PERMISSION_GROUPS: {
  title: string;
  resource: string;
  actions: { key: string; label: string; scoped?: boolean }[];
}[] = [
  {
    title: "Gastos",
    resource: "expenses",
    actions: [
      { key: "create", label: "Crear", scoped: false },
      { key: "read", label: "Ver", scoped: true },
      { key: "update", label: "Editar", scoped: true },
      { key: "delete", label: "Borrar", scoped: true },
    ],
  },
  {
    title: "Ingresos",
    resource: "income",
    actions: [
      { key: "create", label: "Crear", scoped: false },
      { key: "read", label: "Ver", scoped: true },
      { key: "update", label: "Editar", scoped: true },
      { key: "delete", label: "Borrar", scoped: true },
    ],
  },
  {
    title: "Inventario",
    resource: "inventory",
    actions: [
      { key: "create", label: "Crear", scoped: false },
      { key: "read", label: "Ver", scoped: true },
      { key: "update", label: "Editar / movimientos", scoped: true },
      { key: "delete", label: "Borrar", scoped: true },
    ],
  },
];

export function permissionCode(resource: string, action: string, scope?: "own" | "all"): string {
  if (!scope) return `${resource}:${action}`;
  return `${resource}:${action}:${scope}`;
}
