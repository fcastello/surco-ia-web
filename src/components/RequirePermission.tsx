import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { can, canManageUsers, canOwnOrAll } from "../lib/permissions";

type Mode =
  | { kind: "any"; codes: string[] }
  | { kind: "manage-users" }
  | { kind: "resource"; resource: string; needCreate?: boolean };

type Props = {
  mode: Mode;
  children?: React.ReactNode;
};

function allowed(mode: Mode, perms: string[] | undefined): boolean {
  if (mode.kind === "manage-users") return canManageUsers(perms);
  if (mode.kind === "any") return mode.codes.some((c) => can(perms, c));
  const { resource, needCreate } = mode;
  if (needCreate && can(perms, `${resource}:create`)) return true;
  return (
    canOwnOrAll(perms, resource, "read") ||
    canOwnOrAll(perms, resource, "update") ||
    canOwnOrAll(perms, resource, "delete") ||
    can(perms, `${resource}:create`)
  );
}

export function RequirePermission({ mode, children }: Props) {
  const { activeTenant } = useAuth();
  const perms = activeTenant?.permissions;

  if (!allowed(mode, perms)) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
