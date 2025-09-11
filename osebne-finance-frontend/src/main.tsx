import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {AppErrorBoundary} from "@/components/AppErrorBoundary";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 60000, retry: 1, refetchOnWindowFocus: false },
        mutations: { retry: 0 }
    }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <AppErrorBoundary>
                <App />
            </AppErrorBoundary>
        </QueryClientProvider>
    </React.StrictMode>
);
