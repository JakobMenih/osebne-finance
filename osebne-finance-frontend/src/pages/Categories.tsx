import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Amount from "@/components/Amount";
import { useAuth } from "@/store/auth";
import {LineChart} from "recharts";

type Category = { id: number; name: string; description?: string | null; balance?: number | null };

function BarChart({
                      data,
                      show,
                      formatCurrency,
                  }: {
    data: { name: string; value: number }[];
    show: boolean;
    formatCurrency: (n: number) => string;
}) {
    const pad = 32;
    const w = 520;
    const h = 360;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;
    const max = Math.max(1, ...data.map((d) => d.value));

    const gap = 12; // med stolpci
    const barFullWidth = innerW / Math.max(1, data.length);
    const barWidth = Math.max(12, barFullWidth - gap);

    return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
            <g transform={`translate(${pad},${pad})`}>
                {/* os X in Y */}
                <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#2a3547" />
                <line x1={0} y1={0} x2={0} y2={innerH} stroke="#2a3547" />

                {data.map((d, i) => {
                    const x = i * barFullWidth + gap / 2 + (barFullWidth - barWidth) / 2;
                    const barH = (d.value / max) * innerH;
                    const y = innerH - barH;
                    return (
                        <g key={i} transform={`translate(${x},0)`}>
                            <rect
                                x={0}
                                y={y}
                                width={barWidth}
                                height={barH}
                                rx={6}
                                ry={6}
                                fill={d.value >= 0 ? "#22c55e" : "#ef4444"}
                                style={{ transition: "height 250ms, y 250ms" }}
                            />
                            {show && (
                                <text
                                    x={barWidth / 2}
                                    y={y - 8}
                                    textAnchor="middle"
                                    fontSize={12}
                                    style={{ fontWeight: 600 }}
                                >
                                    {formatCurrency(d.value)}
                                </text>
                            )}
                            {/* ime kategorije (rotirano če je dolg) */}
                            <text
                                x={barWidth / 2}
                                y={innerH + 16}
                                textAnchor="middle"
                                fontSize={12}
                                transform={`rotate(0 ${barWidth / 2} ${innerH + 16})`}
                                style={{ whiteSpace: "pre" }}
                            >
                                {d.name}
                            </text>
                        </g>
                    );
                })}
            </g>
        </svg>
    );
}

export default function Categories() {
    const qc = useQueryClient();

    const list = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => (await api.get("/categories")).data,
    });

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [filter, setFilter] = useState("");

    const create = useMutation({
        mutationFn: async () => {
            await api.post("/categories", { name: name.trim(), description: description || null });
        },
        onSuccess: async () => {
            setName("");
            setDescription("");
            await qc.invalidateQueries({ queryKey: ["categories"] });
        },
    });

    const remove = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/categories/${id}`);
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["categories"] });
        },
    });

    const [editId, setEditId] = useState<number | null>(null);

    const update = useMutation({
        mutationFn: async ({ id, name, description }: { id: number; name: string; description: string | null }) => {
            await api.put(`/categories/${id}`, { name: name.trim(), description: description || null });
        },
        onSuccess: async () => {
            setEditId(null);
            await qc.invalidateQueries({ queryKey: ["categories"] });
        },
    });

    type SortKey = "name" | "balance";
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    function head(label: string, key: SortKey) {
        const active = sortKey === key;
        const arrow = active ? (sortDir === "asc" ? "▲" : "▼") : "";
        return (
            <button
                className="secondary"
                onClick={() => {
                    if (active) setSortDir(sortDir === "asc" ? "desc" : "asc");
                    else {
                        setSortKey(key);
                        setSortDir(key === "name" ? "asc" : "desc");
                    }
                }}
                style={{ padding: "6px 10px" }}
            >
                {label} {arrow}
            </button>
        );
    }

    const rows = useMemo(() => {
        const filtered = (list.data || []).filter(
            (c) =>
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
    const formatCurrency = (n: number) =>
        new Intl.NumberFormat(undefined, { style: "currency", currency: curr, maximumFractionDigits: 2 }).format(n);

    const chartData = useMemo(() => {
        return rows
            .map((c) => ({ name: c.name, value: Number(c.balance ?? 0) }))
            .sort((a, b) => b.value - a.value); // največje prvo
    }, [rows]);

    const Chart =
        chartData.length > 0 ? (
            <div className="card" style={{ flex: "0 1 500px", minWidth: 320 }}>
                <h3>Stanja po kategorijah</h3>
                <BarChart data={chartData} show={show} formatCurrency={formatCurrency} />
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
                        <button onClick={() => create.mutate()} disabled={!name.trim()}>
                            Dodaj kategorijo
                        </button>
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
                            {rows.map((c) => {
                                const inEdit = editId === c.id;
                                if (inEdit) {
                                    return (
                                        <tr key={c.id}>
                                            <td>
                                                <input className="input" defaultValue={c.name} id={`cn-${c.id}`} />
                                            </td>
                                            <td>
                                                <input className="input" defaultValue={c.description || ""} id={`cd-${c.id}`} />
                                            </td>
                                            <td className="right">
                                                <Amount value={Number(c.balance ?? 0)} />
                                            </td>
                                            <td className="right row-actions">
                                                <button
                                                    onClick={() =>
                                                        update.mutate({
                                                            id: c.id,
                                                            name: (document.getElementById(`cn-${c.id}`) as HTMLInputElement).value,
                                                            description: (document.getElementById(`cd-${c.id}`) as HTMLInputElement).value,
                                                        })
                                                    }
                                                >
                                                    Shrani
                                                </button>
                                                <button className="secondary" onClick={() => setEditId(null)}>
                                                    Prekliči
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr key={c.id}>
                                        <td>{c.name}</td>
                                        <td>{c.description || ""}</td>
                                        <td className="right">
                                            <Amount value={Number(c.balance ?? 0)} />
                                        </td>
                                        <td className="right row-actions">
                                            <button onClick={() => setEditId(c.id)}>Uredi</button>
                                            <button className="danger" onClick={() => remove.mutate(c.id)}>
                                                Izbriši
                                            </button>
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
                        <div className="card-body">{Chart}</div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
