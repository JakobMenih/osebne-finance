import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {useAuth} from "@/store/auth";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import {normalizeUser} from "@/lib/user";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Protected from "@/components/Protected";
import Incomes from "@/pages/Incomes";
import Expenses from "@/pages/Expenses";
import Transfers from "@/pages/Transfers";
import Categories from "@/pages/Categories";
import Profile from "@/pages/Profile";


const qc = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
    const isAuthed = useAuth((s) => !!s.token);
    const loc = useLocation();
    const inAuth = loc.pathname === "/login" || loc.pathname === "/register";
    return (
        <>
            {isAuthed && !inAuth ? <Navbar /> : null}
            {children}
        </>
    );
}

export default function App() {
    const [booted, setBooted] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { setBooted(true); return; }
        api.post("/auth/profile")
            .then((r: { data: any; }) => {
                const u = normalizeUser(r.data);
                useAuth.getState().setAuth(u, token);
            })
            .finally(() => setBooted(true));
    }, []);

    if (!booted) return null;

    return (
        <QueryClientProvider client={qc}>
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={<Protected><Incomes /></Protected>} />
                        <Route path="/expenses" element={<Protected><Expenses /></Protected>} />
                        <Route path="/transfers" element={<Protected><Transfers /></Protected>} />
                        <Route path="/categories" element={<Protected><Categories /></Protected>} />
                        <Route path="/account" element={<Protected><Profile /></Protected>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </QueryClientProvider>
    );
}
