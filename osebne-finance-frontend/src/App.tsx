import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/store/auth";
import { queryClient } from "@/app/queryClient";
import { router } from "@/app/router";

function Bootstrap() {
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            api.post("/auth/profile")
                .then((r) => useAuth.getState().setAuth(r.data, token))
                .catch(() => {});
        }
    }, []);
    return null;
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Bootstrap />
            <RouterProvider router={router} />
        </QueryClientProvider>
    );
}
