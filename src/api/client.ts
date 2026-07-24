export type TenantInfo = {
  tenant_id: string;
  role: string;
  permissions?: string[];
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

export type FinanceTransactionBody = {
  amount: number;
  currency: string;
  description: string;
  exchange_rate: number;
  /** Fecha de la operación (YYYY-MM-DD o RFC3339). Default: hoy en el servidor. */
  occurred_at?: string;
  /** Categoría del gasto (null = sin categoría). */
  category_id?: number | null;
};

export type FinanceCategory = {
  id: number;
  name: string;
  created_at: string;
};

export async function listFinanceCategories(token: string, tenantId: string) {
  return apiFetch<{ categories: FinanceCategory[] }>(
    "/api/finance/categories",
    {},
    token,
    tenantId,
  );
}

export async function createFinanceCategory(
  token: string,
  tenantId: string,
  name: string,
) {
  return apiFetch<{ category: FinanceCategory }>("/api/finance/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  }, token, tenantId);
}

export type ExchangeRateResponse = {
  currency: string;
  rate_ars: number;
  source: string;
};

export async function getExchangeRate(currency = "USD"): Promise<ExchangeRateResponse> {
  return apiFetch<ExchangeRateResponse>(
    `/api/finance/exchange-rate?currency=${encodeURIComponent(currency)}`,
  );
}

export async function postExpense(
  token: string,
  tenantId: string,
  body: FinanceTransactionBody,
) {
  return apiFetch("/api/finance/transactions/expense", {
    method: "POST",
    body: JSON.stringify(body),
  }, token, tenantId);
}

export async function postIncome(
  token: string,
  tenantId: string,
  body: FinanceTransactionBody,
) {
  return apiFetch("/api/finance/transactions/income", {
    method: "POST",
    body: JSON.stringify(body),
  }, token, tenantId);
}

export async function updateFinanceTransaction(
  token: string,
  tenantId: string,
  id: number,
  body: FinanceTransactionBody,
) {
  return apiFetch(`/api/finance/transactions/${id}`, {
    method: "PATCH",
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

export type InventoryItem = {
  id: number;
  sku: string;
  name: string;
  unit: string;
};

export async function createInventoryItem(
  token: string,
  tenantId: string,
  body: { sku: string; name: string; unit: string },
) {
  return apiFetch<InventoryItem>("/api/inventory/items", {
    method: "POST",
    body: JSON.stringify(body),
  }, token, tenantId);
}

export async function updateInventoryItem(
  token: string,
  tenantId: string,
  sku: string,
  body: { name: string; unit: string },
) {
  return apiFetch<InventoryItem>(
    `/api/inventory/items/${encodeURIComponent(sku)}`,
    { method: "PATCH", body: JSON.stringify(body) },
    token,
    tenantId,
  );
}

export async function deleteInventoryItem(token: string, tenantId: string, sku: string) {
  return apiFetch<void>(
    `/api/inventory/items/${encodeURIComponent(sku)}`,
    { method: "DELETE" },
    token,
    tenantId,
  );
}

export async function postInventoryMovement(
  token: string,
  tenantId: string,
  body: {
    sku: string;
    direction: "in" | "out";
    quantity: number;
    metadata?: { owner_type?: "own" | "contractor" };
  },
) {
  return apiFetch("/api/inventory/movements", {
    method: "POST",
    body: JSON.stringify(body),
  }, token, tenantId);
}

export type InventoryMovement = {
  id: number;
  sku: string;
  item_name: string;
  unit: string;
  direction: "in" | "out" | string;
  quantity: number;
  created_by: string;
  created_at: string;
  metadata?: { owner_type?: string };
};

export async function listInventoryMovements(
  token: string,
  tenantId: string,
  sku?: string,
) {
  const q = sku ? `?sku=${encodeURIComponent(sku)}` : "";
  return apiFetch<{ movements: InventoryMovement[] }>(
    `/api/inventory/movements${q}`,
    {},
    token,
    tenantId,
  );
}

export type FinanceEntry = {
  id: number;
  entry_type: "expense" | "income" | string;
  description: string;
  occurred_at: string;
  currency: string;
  amount: number;
  exchange_rate: number;
  amount_ars: number;
  amount_usd: number;
  status: string;
  category_id: number | null;
  category: string;
  created_by: string;
  created_at: string;
  today_exchange_rate?: number;
  amount_usd_at_today_rate?: number;
};

export async function listFinanceTransactions(token: string, tenantId: string) {
  return apiFetch<{
    tenant_id: string;
    today_exchange_rate: number;
    transactions: FinanceEntry[];
  }>("/api/finance/transactions", {}, token, tenantId);
}

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

export async function patchUserRole(
  token: string,
  tenantId: string,
  email: string,
  role: string,
) {
  return apiFetch(`/api/tenant-admin/users/${encodeURIComponent(email)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  }, token, tenantId);
}

export async function deleteUser(token: string, tenantId: string, email: string) {
  return apiFetch<void>(
    `/api/tenant-admin/users/${encodeURIComponent(email)}`,
    { method: "DELETE" },
    token,
    tenantId,
  );
}

export type TenantRole = {
  id: number;
  tenant_id: string;
  slug: string;
  display_name: string;
  is_system: boolean;
  permissions: string[];
};

export async function listRoles(token: string, tenantId: string) {
  return apiFetch<{ roles: TenantRole[]; permissions: string[] }>(
    "/api/tenant-admin/roles",
    {},
    token,
    tenantId,
  );
}

export async function createRole(
  token: string,
  tenantId: string,
  body: { slug: string; display_name: string; permissions: string[] },
) {
  return apiFetch<{ role: TenantRole }>("/api/tenant-admin/roles", {
    method: "POST",
    body: JSON.stringify(body),
  }, token, tenantId);
}

export async function updateRole(
  token: string,
  tenantId: string,
  slug: string,
  body: { display_name: string; permissions: string[] },
) {
  return apiFetch<{ role: TenantRole }>(
    `/api/tenant-admin/roles/${encodeURIComponent(slug)}`,
    { method: "PATCH", body: JSON.stringify(body) },
    token,
    tenantId,
  );
}

export async function deleteRole(token: string, tenantId: string, slug: string) {
  return apiFetch<{ deleted: string }>(
    `/api/tenant-admin/roles/${encodeURIComponent(slug)}`,
    { method: "DELETE" },
    token,
    tenantId,
  );
}

export async function deleteFinanceTransaction(token: string, tenantId: string, id: number) {
  return apiFetch(`/api/finance/transactions/${id}`, {
    method: "DELETE",
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
