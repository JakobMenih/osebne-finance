import axios, { type InternalAxiosRequestConfig, type AxiosError, type AxiosResponse } from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    timeout: 15000
});

api.interceptors.request.use(
    (cfg: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem("token");
        if (token) {
            const h: any = cfg.headers ?? {};
            if (typeof h.set === "function") h.set("Authorization", `Bearer ${token}`);
            else (h as Record<string, string>)["Authorization"] = `Bearer ${token}`;
            cfg.headers = h;
        }
        return cfg;
    },
    (err: AxiosError) => Promise.reject(err)
);

api.interceptors.response.use(
    (res: AxiosResponse) => res,
    (err: AxiosError) => Promise.reject(err)
);

export function setToken(token: string | null) {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
}

export async function uploadFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    const r = await api.post("/uploads", form, { headers: { "Content-Type": "multipart/form-data" } });
    return r.data;
}

export async function linkUploadToIncome(uploadId: number, incomeId: number) {
    const r = await api.post(`/uploads/${uploadId}/link/income/${incomeId}`);
    return r.data;
}

export async function linkUploadToExpense(uploadId: number, expenseId: number) {
    const r = await api.post(`/uploads/${uploadId}/link/expense/${expenseId}`);
    return r.data;
}

export function fileUrl(id: number) {
    return `${api.defaults.baseURL}/uploads/${id}`;
}

export default api;
