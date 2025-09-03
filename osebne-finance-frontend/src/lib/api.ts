const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let token = localStorage.getItem('token') || '';
export function setToken(t: string) { token = t; localStorage.setItem('token', t); }
export function clearToken() { token = ''; localStorage.removeItem('token'); }

async function request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {});
    if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(`${API_URL}${path}`, { ...init, headers });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) throw new Error(typeof data === 'string' ? data : data?.message || 'Napaka');
    return data;
}

export async function register(email: string, password: string) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
}
export async function login(email: string, password: string) {
    const r = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(r.access_token); return r;
}
export async function profile() { return request('/auth/profile', { method: 'POST' }); }

export type Account = { id: string; name: string; type: string; currency: string };
export type Category = { id: string; name: string; type: string };
export type Transaction = { id: string; date: string; description?: string|null };
export type TransactionLine = { id: string; transactionId: string; accountId: string; categoryId?: string|null; amount: number; currency: string; description?: string|null };
export type Budget = { id: string; categoryId: string; periodStart: string; periodEnd: string; amount: number };
export type Upload = { id: string; userId: string; source?: string|null; fileMetadata: any; createdAt: string };
export type AuditLog = { id: string; action?: string; entity?: string; data?: any; createdAt: string };

export function getAccounts(): Promise<Account[]> { return request('/accounts'); }
export function createAccount(p: {name: string; type: string; currency: string}) { return request('/accounts', { method: 'POST', body: JSON.stringify(p) }); }
export function updateAccount(id: string, p: Partial<{name: string; type: string; currency: string}>) { return request(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(p) }); }
export function deleteAccount(id: string) { return request(`/accounts/${id}`, { method: 'DELETE' }); }

export function getCategories(): Promise<Category[]> { return request('/categories'); }
export function createCategory(p: {name: string; type: string; parentId?: string|null}) { return request('/categories', { method: 'POST', body: JSON.stringify(p) }); }
export function updateCategory(id: string, p: Partial<{name: string; type: string; parentId?: string|null}>) { return request(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(p) }); }
export function deleteCategory(id: string) { return request(`/categories/${id}`, { method: 'DELETE' }); }

export function getTransactions(): Promise<Transaction[]> { return request('/transactions'); }
export function getTransaction(id: string): Promise<Transaction> { return request(`/transactions/${id}`); }
export function createTransaction(p: {date: string; description?: string|null}) { return request('/transactions', { method: 'POST', body: JSON.stringify(p) }); }
export function updateTransaction(id: string, p: Partial<{date: string; description?: string|null}>) { return request(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(p) }); }
export function deleteTransaction(id: string) { return request(`/transactions/${id}`, { method: 'DELETE' }); }

export function getLines(transactionId: string): Promise<TransactionLine[]> { return request(`/transaction-lines/${transactionId}`); }
export function createLine(p: {transactionId: string; accountId: string; categoryId?: string|null; amount: number; description?: string|null}) { return request('/transaction-lines', { method: 'POST', body: JSON.stringify(p) }); }
export function updateLine(id: string, p: Partial<{accountId: string; categoryId?: string|null; amount: number; description?: string|null}>) { return request(`/transaction-lines/${id}`, { method: 'PATCH', body: JSON.stringify(p) }); }
export function deleteLine(id: string) { return request(`/transaction-lines/${id}`, { method: 'DELETE' }); }

export function getBudgets(): Promise<Budget[]> { return request('/budgets'); }
export function createBudget(p: {categoryId: string; periodStart: string; periodEnd: string; amount: number}) { return request('/budgets', { method: 'POST', body: JSON.stringify(p) }); }
export function updateBudget(id: string, p: Partial<{categoryId: string; periodStart: string; periodEnd: string; amount: number}>) { return request(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(p) }); }
export function deleteBudget(id: string) { return request(`/budgets/${id}`, { method: 'DELETE' }); }

export function listUploads(): Promise<Upload[]> { return request('/uploads'); }
export async function downloadUpload(id: string) {
    const headers = new Headers(); if (token) headers.set('Authorization', `Bearer ${token}`);
    const r = await fetch(`${API_URL}/uploads/${id}/download`, { headers });
    if (!r.ok) throw new Error('Napaka pri prenosu'); return await r.blob();
}
export function deleteUpload(id: string) { return request(`/uploads/${id}`, { method: 'DELETE' }); }
export async function uploadFile(file: File, source = 'upload') {
    const fd = new FormData(); fd.append('file', file); fd.append('source', source);
    return request('/uploads/file', { method: 'POST', body: fd });
}

export function getAuditLogs(): Promise<AuditLog[]> { return request('/audit-logs'); }
