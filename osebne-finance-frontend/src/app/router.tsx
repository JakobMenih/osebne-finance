import { createBrowserRouter, Navigate } from "react-router-dom";
import Protected from "@/components/Protected";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Categories from "@/pages/Categories";
import Incomes from "@/pages/Incomes";
import Expenses from "@/pages/Expenses";
import AppShell from "@/app/shell";
import Transfers from "@/pages/Transfers";

export const router = createBrowserRouter([
    { path: "/", element: <Navigate to="/incomes" replace /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    {
        element: (
            <Protected>
                <AppShell />
            </Protected>
        ),
        children: [
            { path: "/incomes", element: <Incomes /> },
            { path: "/expenses", element: <Expenses /> },
            { path: "/categories", element: <Categories /> },
            { path: "/transfers", element: <Transfers /> },
            { path: "/profile", element: <Profile /> },
        ],
    },
    { path: "*", element: <Navigate to="/" replace /> },
]);
