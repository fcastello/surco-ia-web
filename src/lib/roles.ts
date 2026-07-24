/** Valores de API/DB (no cambiar) → etiqueta en UI */
const ROLE_LABELS: Record<string, string> = {
  tenant_owner: "Propietario",
  member: "Miembro",
  super_admin: "Super administrador",
};

export function roleLabel(role: string | undefined | null): string {
  if (!role) return "";
  return ROLE_LABELS[role] ?? role;
}
