import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth";
import api from "@/lib/api";
import { normalizeUser } from "@/lib/user";

const currencies = ["EUR","USD","GBP","CHF","JPY","HRK","RSD","BAM","HUF","PLN","CZK","DKK","SEK","NOK","AUD","CAD","CNY"];

export default function Profile() {
    const { user, setUser } = useAuth();
    const [firstName, setFirstName] = useState(user?.firstName || "");
    const [lastName, setLastName] = useState(user?.lastName || "");
    const [currency, setCurrency] = useState(user?.defaultCurrency || "EUR");
    const [showAmounts, setShowAmounts] = useState<boolean>(user?.showAmounts ?? true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [perr, setPerr] = useState<string | null>(null);
    const [c1, setC1] = useState("");
    const [c2, setC2] = useState("");
    const [c3, setC3] = useState("");

    useEffect(() => {
        async function load() {
            const me = await api.post("/auth/profile");
            setUser(normalizeUser(me.data));
        }
        if (!user?.email) load();
    }, []);

    useEffect(() => {
        setFirstName(user?.firstName || "");
        setLastName(user?.lastName || "");
        setCurrency(user?.defaultCurrency || "EUR");
        setShowAmounts(user?.showAmounts ?? true);
    }, [user]);

    async function saveProfile() {
        setSaving(true);
        setMsg(null);
        try {
            const r = await api.put("/auth/profile", { firstName, lastName, defaultCurrency: currency, showAmounts });
            setUser(normalizeUser(r.data ?? { firstName, lastName, defaultCurrency: currency, showAmounts }));
            setMsg("Shranjeno");
        } catch {
            setMsg("Shranjevanje ni uspelo");
        } finally {
            setSaving(false);
        }
    }

    async function changePassword() {
        setPerr(null);
        if (!c2 || c2 !== c3) { setPerr("Gesli se ne ujemata"); return; }
        try {
            await api.put("/auth/password", { currentPassword: c1, newPassword: c2 });
            setC1(""); setC2(""); setC3("");
            setPerr("Geslo je spremenjeno");
        } catch {
            setPerr("Sprememba gesla ni uspela");
        }
    }

    return (
        <div className="grid grid-2">
            <div className="card stack">
                <h2>Uporabniški račun</h2>
                <div className="field inline"><label>Ime</label><input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
                <div className="field inline"><label>Priimek</label><input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
                <div className="field inline"><label>Email</label><input value={user?.email || ""} disabled /></div>
                <div className="field inline"><label>Valuta</label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)}>{currencies.map((c) => (<option key={c} value={c}>{c}</option>))}</select>
                </div>
                <div className="field inline"><label>Pokaži zneske</label>
                    <select value={showAmounts ? "1" : "0"} onChange={(e) => setShowAmounts(e.target.value === "1")}><option value="1">Da</option><option value="0">Ne</option></select>
                </div>
                <div className="actions"><button onClick={saveProfile} disabled={saving}>Shrani</button>{msg && <span className="badge">{msg}</span>}</div>
            </div>

            <div className="card stack">
                <h2>Sprememba gesla</h2>
                <div className="field inline"><label>Trenutno geslo</label><input type="password" value={c1} onChange={(e) => setC1(e.target.value)} /></div>
                <div className="field inline"><label>Novo geslo</label><input type="password" value={c2} onChange={(e) => setC2(e.target.value)} /></div>
                <div className="field inline"><label>Potrdi novo geslo</label><input type="password" value={c3} onChange={(e) => setC3(e.target.value)} /></div>
                <div className="actions"><button onClick={changePassword}>Spremeni geslo</button>{perr && <span className="badge">{perr}</span>}</div>
            </div>
        </div>
    );
}
