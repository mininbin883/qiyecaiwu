const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4100/api';
const TOKEN_KEY = 'fms_auth_token';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  roleKey: string;
  permissions: string[];
}

export interface BootstrapResponse {
  user: AuthUser;
  collections: Record<string, unknown[]>;
}

export function getAuthToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message ?? '请求失败');
  }
  return payload as T;
}

export async function login(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchBootstrap(): Promise<BootstrapResponse> {
  return request('/bootstrap');
}

export async function saveCollection<T>(name: string, data: T[]): Promise<T[]> {
  const dedicatedRoutes: Record<string, string> = {
    incomes: '/incomes',
    expenses: '/expenses',
  };
  const response = await request<{ data: T[] }>(dedicatedRoutes[name] ?? `/collections/${name}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
  return response.data;
}

export async function approveRecord(id: string): Promise<unknown> {
  const response = await request<{ data: unknown }>(`/approvals/${id}/approve`, { method: 'POST' });
  return response.data;
}

export async function rejectRecord(id: string): Promise<unknown> {
  const response = await request<{ data: unknown }>(`/approvals/${id}/reject`, { method: 'POST' });
  return response.data;
}

export async function uploadImport(moduleName: string, file: File): Promise<{ count: number; data: unknown[] }> {
  const form = new FormData();
  form.append('file', file);
  return request(`/imports/${moduleName}`, {
    method: 'POST',
    body: form,
  });
}

export async function fetchDashboardSummary(): Promise<unknown> {
  const response = await request<{ data: unknown }>('/dashboard/summary');
  return response.data;
}

export async function fetchCashflowForecast(): Promise<unknown[]> {
  const response = await request<{ data: unknown[] }>('/cashflow/forecast');
  return response.data;
}

export async function fetchRiskSummary(): Promise<unknown> {
  const response = await request<{ data: unknown }>('/risks/summary');
  return response.data;
}
