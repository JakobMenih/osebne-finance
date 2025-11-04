import { useMemo, useState } from "react";
import api from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import Amount from "@/components/Amount";
import { useAuth } from "@/store/auth";

type Category = { id: number; name: string; description?: string | null; balance?: number | null };

type SortKey = "name" | "balance";
type SortDir = "asc" | "desc";

function HBarChart({ data, show, formatCurrency }: { data: { name: string; value: number }[]; show: boolean; formatCurrency: (v: number) => string }) {
    const barH = 24;
    const gap = 10;
    const paddingX = 120;
    const maxAbs = data.length ? Math.max(...data.map(d => Math.abs(d.value))) : 1;
    const width = 600;
    const height = data.length * (barH + gap) + 20;
    return (
        <div style={{ width: "100%" }}>
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
                {data.map((d, i) => {
                    const y = i * (barH + gap);
                    const w = ((width - paddingX - 16) * Math.abs(d.value)) / maxAbs;
                    const fill = d.value >= 0 ? "#10b981" : "#ef4444";
                    return (
                        <g key={d.name}>
                            <text x={8} y={y + barH * 0.7} fontSize="12" fill="#374151">{d.name}</text>
                            <rect x={paddingX} y={y} width={w} height={barH} fill={fill} rx="4" />
                            <text x={paddingX + w + 6} y={y + barH * 0.7} fontSize="11" fill="#6b7280">
                                {show ? formatCurrency(d.value) : "****"}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export default function Categories() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [filter, setFilter] = useState("");
    const [editId, setEditId] = useState<number | null>(null);

    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    const list = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => (await api.get("/categories")).data
    });

    const create = useMutation({
        mutationFn: async () => (await api.post("/categories", { name, description: description || null })).data,
        onSuccess: () => { setName(""); setDescription(""); list.refetch(); }
    });

    const update = useMutation({
        mutationFn: async (p: { id: number; name: string; description: string }) =>
            (await api.put(`/categories/${p.id}`, { name: p.name, description: p.description || null })).data,
        onSuccess: () => { setEditId(null); list.refetch(); }
    });

    const remove = useMutation({
        mutationFn: async (id: number) => (await api.delete(`/categories/${id}`)).data,
        onSuccess: () => list.refetch()
    });

    function head(label: string, key: SortKey) {
        const active = sortKey === key;
        const arrow = active ? (sortDir === "asc" ? "▲" : "▼") : "⇅";
        return (
            <button
                className="secondary"
                onClick={() => {
                    if (sortKey !== key) { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
                    else { setSortDir(sortDir === "asc" ? "desc" : "asc"); }
                }}
                style={{ padding: "6px 10px" }}
            >
                {label} {arrow}
            </button>
        );
    }

    const rows = useMemo(() => {
        const filtered = (list.data || []).filter(c =>
            c.name.toLowerCase().includes(filter.toLowerCase()) ||
            (c.description || "").toLowerCase().includes(filter.toLowerCase())
        );
        const arr = [...filtered];
        arr.sort((a, b) => {
            if (sortKey === "name") {
                const av = a.name.toLowerCase();
                const bv = b.name.toLowerCase();
                return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            }
            const av = Number(a.balance ?? 0);
            const bv = Number(b.balance ?? 0);
            return sortDir === "asc" ? av - bv : bv - av;
        });
        return arr;
    }, [list.data, filter, sortKey, sortDir]);

    const { user } = useAuth();
    const show = user?.showAmounts ?? true;
    const curr = user?.defaultCurrency || "EUR";

    const chartData = useMemo(() => rows.map(c => ({ name: c.name, value: Number(c.balance ?? 0) })), [rows]);
    const formatCurrency = (val: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: curr, maximumFractionDigits: 2 }).format(val);

    const Chart = chartData.length > 0 ? (
        <div className="card" style={{ flex: "0 1 420px", minWidth: 280 }}>
            <h3>Stanja po kategorijah</h3>
            <HBarChart data={chartData} show={show} formatCurrency={formatCurrency} />
        </div>
    ) : null;

    return (
        <div className="container page">
            <h1>Kategorije</h1>

            <div className="card">
                <div className="toolbar" style={{ gap: 8, flexWrap: "wrap" }}>
                    <input className="input" placeholder="Ime" value={name} onChange={(e) => setName(e.target.value)} />
                    <input className="input" placeholder="Opis" value={description} onChange={(e) => setDescription(e.target.value)} />
                    <input className="input" placeholder="Filter" value={filter} onChange={(e) => setFilter(e.target.value)} />
                    <div className="actions">
                        <button onClick={() => create.mutate()} disabled={!name.trim()}>Dodaj kategorijo</button>
                    </div>
                </div>
            </div>

            <div className="with-aside-charts">
                <div className="list-column">
                    <div className="card">
                        <table className="table">
                            <thead>
                            <tr>
                                <th>{head("Ime", "name")}</th>
                                <th>Opis</th>
                                <th className="right">{head("Stanje", "balance")}</th>
                                <th className="right">Akcije</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map(c => {
                                const inEdit = editId === c.id;
                                if (inEdit) {
                                    return (
                                        <tr key={c.id}>
                                            <td><input className="input" defaultValue={c.name} id={`cn-${c.id}`} /></td>
                                            <td><input className="input" defaultValue={c.description || ""} id={`cd-${c.id}`} /></td>
                                            <td className="right"><Amount value={Number(c.balance ?? 0)} /></td>
                                            <td className="right row-actions">
                                                <button onClick={() => update.mutate({
                                                    id: c.id,
                                                    name: (document.getElementById(`cn-${c.id}`) as HTMLInputElement).value,
                                                    description: (document.getElementById(`cd-${c.id}`) as HTMLInputElement).value
                                                })}>Shrani</button>
                                                <button className="secondary" onClick={() => setEditId(null)}>Prekliči</button>
                                            </td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr key={c.id}>
                                        <td>{c.name}</td>
                                        <td>{c.description || ""}</td>
                                        <td className="right"><Amount value={Number(c.balance ?? 0)} /></td>
                                        <td className="right row-actions">
                                            <button onClick={() => setEditId(c.id)}>Uredi</button>
                                            <button className="danger" onClick={() => remove.mutate(c.id)}>Izbriši</button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <aside className="charts-aside">
                    <div className="card chart-card">
                        <div className="card-body">
                            {Chart}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
