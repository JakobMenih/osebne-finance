import { NavLink } from "react-router-dom";
import { useAuth } from "@/store/auth";

export default function Navbar() {
    const { user, logout } = useAuth();
    const displayName = [user?.firstName, user?.lastName].
    filter(Boolean).join(" ") || user?.email || "";
    return (
        <nav className="navbar">
            <NavLink to="/incomes">Prihodki</NavLink>
            <NavLink to="/expenses">Odhodki</NavLink>
            <NavLink to="/transfers">Prenosi</NavLink>
            <NavLink to="/categories">Kategorije</NavLink>
            <div className="spacer" />
            {user && (
                <div className="user">
                    <span className="badge">{displayName}</span>
                    <NavLink to="/profile">Račun</NavLink>
                    <button onClick={logout}>Odjava</button>
                </div>
            )}
        </nav>
    );
}
