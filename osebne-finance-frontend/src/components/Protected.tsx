import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth";

type Props = { children: ReactNode };

export default function Protected({ children }: Props) {
    const { user } = useAuth();
    const loc = useLocation();
    if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
    return <>{children}</>;
}
