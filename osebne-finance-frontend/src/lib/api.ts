const BASE = (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, '') || '';

type Options = { method?: string; body?: any; headers?: Record<string, string>; auth?: boolean; };

function getToken() {
    return localStorage.getItem('token') || '';
}

export async function api(path: string, opts: Options = {}) {
    const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = { ...(opts.headers || {}) };
    const usingFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;
    if (!usingFormData) {
        if (opts.body && typeof opts.body === 'object') {
            headers['Content-Type'] = headers['Content-Type'] || 'application/json';
            opts.body = JSON.stringify(opts.body);
        }
    }
    if (opts.auth !== false) {
        const t = getToken();
        if (t) headers['Authorization'] = `Bearer ${t}`;
    }
    let res: Response;
    try {
        res = await fetch(url, {
            method: opts.method || (opts.body ? 'POST' : 'GET'),
            body: opts.body,
            headers,
            credentials: 'omit',
        });
    } catch {
        throw new Error('Ni povezave do API (network/CORS). Preveri VITE_API_URL in HTTPS.');
    }
    const text = await res.text();
    let payload: any = null;
    try {
        payload = text ? JSON.parse(text) : null;
    } catch {
        payload = text;
    }
    if (!res.ok) {
        const message =
            (payload && (payload.message || payload.error || payload.detail)) ||
            `Napaka ${res.status}`;
        const e = new Error(String(message)) as any;
        e.status = res.status;
        e.payload = payload;
        throw e;
    }
    return payload;
}

export const get = (p: string, h?: any) => api(p, { method: 'GET', headers: h });
export const post = (p: string, b?: any, h?: any) => api(p, { method: 'POST', body: b, headers: h });
export const patch = (p: string, b?: any, h?: any) => api(p, { method: 'PATCH', body: b, headers: h });
export const del = (p: string, h?: any) => api(p, { method: 'DELETE', headers: h });

export type AccountType = 'checking' | 'savings' | 'cash';
export type CategoryType = 'expense' | 'income';

export interface Account {
    id: string;
    userId: string;
    name: string;
    type: AccountType;
    currency: string;
    metadata?: any;
    createdAt: string;
}
export interface Category {
    id: string;
    userId: string;
    name: string;
    type: CategoryType;
    parentId?: string | null;
    metadata?: any;
    createdAt: string;
}
export interface Transaction {
    id: string;
    userId: string;
    date: string;
    description?: string | null;
    metadata?: any;
    createdAt: string;
}
export interface TransactionLine {
    id: string;
    transactionId: string;
    accountId: string;
    categoryId?: string | null;
    amount: number;
    currency: string;
    description?: string | null;
    createdAt: string;
}
export interface Upload {
    id: string;
    userId: string;
    source?: string;
    fileMetadata?: { originalName?: string; mimetype?: string; size?: number };
    createdAt: string;
}
export interface Budget {
    id: string;
    userId: string;
    categoryId: string;
    periodStart: string;
    periodEnd: string;
    amount: number;
    metadata?: any;
    createdAt: string;
}
export interface AuditLog {
    id: string;
    tableName: string;
    recordId: string;
    action: string;
    oldData?: any;
    newData?: any;
    userId?: string;
    ts: string;
}
export interface FxRate {
    id: string;
    base: string;
    quote: string;
    rate: number;
    rateDate: string;
    source?: string | null;
    createdAt: string;
}

export const registerUser = (b: { email: string; password: string }) => post('/auth/register', b);
export const loginUser    = (b: { email: string; password: string }) => post('/auth/login', b);
export const getProfile   = () => post('/auth/profile', {});

export const getAccounts    = (): Promise<Account[]> => get('/accounts');
export const createAccount  = (b: { name: string; type: AccountType; currency: string }) => post('/accounts', b);
export const updateAccount  = (id: string, b: { name?: string; type?: AccountType; currency?: string }) => patch(`/accounts/${id}`, b);
export const deleteAccount  = (id: string) => del(`/accounts/${id}`);

export const getCategories    = (): Promise<Category[]> => get('/categories');
export const createCategory   = (b: { name: string; type: CategoryType; parentId?: string | null }) => post('/categories', b);
export const updateCategory   = (id: string, b: { name?: string; type?: CategoryType; parentId?: string | null }) => patch(`/categories/${id}`, b);
export const deleteCategory   = (id: string) => del(`/categories/${id}`);

export const getTransactions   = (): Promise<Transaction[]> => get('/transactions');
export const createTransaction = (b: { date: string; description?: string | null; metadata?: any }) => post('/transactions', b);
export const getTransaction    = (id: string): Promise<Transaction> => get(`/transactions/${id}`);
export const deleteTransaction = (id: string) => del(`/transactions/${id}`);

export const getLines    = (transactionId: string): Promise<TransactionLine[]> => get(`/transactions/${transactionId}/lines`);
export const createLine  = (b: { transactionId: string; accountId: string; categoryId?: string; amount: number; currency: string; description?: string }) => post('/transactions/lines', b);
export const deleteLine  = (lineId: string) => del(`/transactions/lines/${lineId}`);

export const listUploads   = (): Promise<Upload[]> => get('/uploads');
export const uploadFile    = (file: File, source = 'upload'): Promise<Upload> => {
    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('source', source);
    return api('/uploads', { method: 'POST', body: fd });
};
export const deleteUpload  = (id: string) => del(`/uploads/${id}`);
export const downloadUpload = async (id: string): Promise<Blob> => {
    const envBase = (import.meta as any).env?.VITE_API_URL;
    const BASE = (envBase ? String(envBase) : 'http://localhost:3000').replace(/\/+$/, '');
    const url = `${BASE}/uploads/${id}/download`;
    const t = getToken();
    const res = await fetch(url, { headers: t ? { Authorization: `Bearer ${t}` } : undefined });
    if (!res.ok) throw new Error(`Napaka ${res.status}`);
    return await res.blob();
};

export const getBudgets    = (): Promise<Budget[]> => get('/budgets');
export const createBudget  = (b: { categoryId: string; periodStart: string; periodEnd: string; amount: number; metadata?: any }) => post('/budgets', b);
export const updateBudget  = (id: string, b: { amount?: number; periodStart?: string; periodEnd?: string; metadata?: any }) => patch(`/budgets/${id}`, b);
export const deleteBudget  = (id: string) => del(`/budgets/${id}`);

export const getFxRates = (): Promise<FxRate[]> => get('/fx');

export const getAuditLogs = (): Promise<AuditLog[]> => get('/audit-logs');
