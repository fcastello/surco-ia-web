import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as apiLogin, type AuthSession, type TenantInfo } from "../api/client";

const STORAGE_KEY = "surco.session";

type SessionState = AuthSession & { activeTenantId: string };

function loadSession(): SessionState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

type AuthContextValue = {
  session: SessionState | null;
  activeTenant: TenantInfo | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setActiveTenantId: (tenantId: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(() => loadSession());

  const persist = useCallback((next: SessionState | null) => {
    setSession(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const resp = await apiLogin(email, password);
    const activeTenantId = resp.tenants[0]?.tenant_id ?? "";
    persist({ ...resp, activeTenantId });
  }, [persist]);

  const logout = useCallback(() => persist(null), [persist]);

  const setActiveTenantId = useCallback((tenantId: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, activeTenantId: tenantId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const activeTenant = useMemo(
    () => session?.tenants.find((t) => t.tenant_id === session.activeTenantId) ?? null,
    [session],
  );

  const value = useMemo(
    () => ({ session, activeTenant, login, logout, setActiveTenantId }),
    [session, activeTenant, login, logout, setActiveTenantId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
