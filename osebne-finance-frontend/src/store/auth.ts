import { create } from "zustand";
import api, { setToken } from "@/lib/api";
import { normalizeUser, type AppUser } from "@/lib/user";

type AuthState = {
    user: AppUser | null;
    token: string | null;
    ready: boolean;
    setAuth: (user: AppUser, token: string) => void;
    setUser: (user: AppUser) => void;
    logout: () => void;
    hydrate: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
    user: null,
    token: null,
    ready: false,
    setAuth: (user, token) => {
        set({ user, token });
        setToken(token);
        localStorage.setItem("token", token);
    },
    setUser: (user) => set({ user }),
    logout: () => {
        set({ user: null, token: null, ready: true });
        setToken(null);
        localStorage.removeItem("token");
    },
    hydrate: async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            set({ ready: true });
            return;
        }
        setToken(token);
        try {
            const me = await api.post("/auth/profile");
            const u = normalizeUser(me.data);
            set({ user: u, token, ready: true });
        } catch {
            localStorage.removeItem("token");
            set({ user: null, token: null, ready: true });
        }
    }
}));

export async function bootstrapAuth() {
    await useAuth.getState().hydrate();
}
