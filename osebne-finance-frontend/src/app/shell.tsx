import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

export default function AppShell() {
    return (
        <div className="layout">
            <Navbar />
            <main className="container">
                <Outlet />
            </main>
        </div>
    );
}
