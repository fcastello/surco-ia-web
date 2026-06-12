export type TenantInfo = {
  tenant_id: string;
  role: string;
  cluster_id: string;
  database_name: string;
  pg_user: string;
  namespace: string;
};

export type AuthSession = {
  token: string;
  user_id: string;
  platform_role?: string;
  tenants: TenantInfo[];
};

export type ApiError = {
  code: string;
  message: string;
};

export class SurcoApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, body: ApiError) {
    super(body.message);
    this.code = body.code;
    this.status = status;
  }
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function parseError(res: Response): Promise<never> {
  let body: ApiError = { code: "error", message: res.statusText };
  try {
    body = (await res.json()) as ApiError;
  } catch {
    /* ignore */
  }
  throw new SurcoApiError(res.status, body);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
  tenantId?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (tenantId) {
    headers.set("X-Tenant-ID", tenantId);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    await parseError(res);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export async function login(email: string, password: string): Promise<AuthSession> {
  return apiFetch<AuthSession>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function postExpense(
  token: string,
  tenantId: string,
  body: { amount: number; currency: string; description: string },
) {
  return apiFetch("/api/finance/transactions/expense", {
    method: "POST",
    body: JSON.stringify(body),
  }, token, tenantId);
}

export async function postIncome(
  token: string,
  tenantId: string,
  body: { amount: number; currency: string; description: string },
) {
  return apiFetch("/api/finance/transactions/income", {
    method: "POST",
    body: JSON.stringify(body),
  }, token, tenantId);
}

export async function getStock(token: string, tenantId: string) {
  return apiFetch<{ items: StockRow[] }>("/api/inventory/stock", {}, token, tenantId);
}

export type StockRow = {
  sku: string;
  name: string;
  unit: string;
  quantity: number;
};

export async function listUsers(token: string, tenantId: string) {
  return apiFetch<{ users: { email: string; role: string }[] }>(
    "/api/tenant-admin/users",
    {},
    token,
    tenantId,
  );
}

export async function addUser(
  token: string,
  tenantId: string,
  body: { email: string; role: string },
) {
  return apiFetch("/api/tenant-admin/users", {
    method: "POST",
    body: JSON.stringify(body),
  }, token, tenantId);
}

export async function getFinanceSummary(token: string, tenantId: string) {
  return apiFetch<{ summary: {
    today_exchange_rate: number;
    expenses: { amount_ars_at_close: number; amount_usd_at_close: number };
    income: { amount_ars_at_close: number; amount_usd_at_close: number };
    net_ars_at_close: number;
    net_usd_at_close: number;
  } }>("/api/finance/summary", {}, token, tenantId);
}
