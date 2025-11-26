import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDateSL, todayISO } from "@/lib/date";
import Amount from "@/components/Amount";
import { useAuth } from "@/store/auth";

type TransferRow = {
    id: number;
    fromCategoryId: number;
    toCategoryId: number;
    amount: number;
    description: string | null;
    transferDate: string;
};

type Category = { id: number; name: string; description?: string | null; balance?: number | null };

function parseAmount(input: string) {
    const n = Number((input || "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
}

function VBarChart({
                       data,
                       show,
                       formatCurrency,
                   }: {
    data: { name: string; value: number }[];
    show: boolean;
    formatCurrency: (n: number) => string;
}) {
    const pad = 28;
    const w = 520;
    const h = 360;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;
    const max = Math.max(1, ...data.map((d) => d.value));
    const stepX = innerW / Math.max(1, data.length);
    return (
        <svg viewBox={`0 0 ${w} ${h}`}>
            {data.map((d, i) => {
                const x = pad + i * stepX + stepX * 0.1;
                const bw = stepX * 0.8;
                const bh = (d.value / max) * innerH;
                const y = pad + innerH - bh;
                return (
                    <g key={i}>
                        <rect x={x} y={y} width={bw} height={bh} fill="#22c55e" />
                        <text x={x + bw / 2} y={h - 6} textAnchor="middle">
                            {d.name}
                        </text>
                        {show && (
                            <text x={x + bw / 2} y={y - 6} textAnchor="middle">
                                {formatCurrency(d.value)}
                            </text>
                        )}
                    </g>
                );
            })}
            <g className="tick">
                <line x1={pad} y1={pad + innerH} x2={pad + innerW} y2={pad + innerH} stroke="#2a3547" />
                <line x1={pad} y1={pad} x2={pad} y2={pad + innerH} stroke="#2a3547" />
            </g>
        </svg>
    );
}

export default function Transfers() {
    const qc = useQueryClient();

    const categories = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => (await api.get("/categories")).data,
    });

    const list = useQuery<TransferRow[]>({
        queryKey: ["transfers"],
        queryFn: async () => (await api.get("/transfers")).data,
    });

    const [form, setForm] = useState<{ fromId: number; toId: number; amount: string; description: string; date: string }>(
        { fromId: 0, toId: 0, amount: "", description: "", date: todayISO() }
    );

    const canSave =
        form.fromId > 0 && form.toId > 0 && form.fromId !== form.toId && parseAmount(form.amount) > 0 && !!form.date;

    const create = useMutation({
        mutationFn: async () => {
            await api.post("/transfers", {
                fromCategoryId: form.fromId,
                toCategoryId: form.toId,
                amount: parseAmount(form.amount),
                description: form.description || null,
                transferDate: new Date(form.date).toISOString(),
            });
        },
        onSuccess: async () => {
            setForm({ fromId: 0, toId: 0, amount: "", description: "", date: todayISO() });
            await qc.invalidateQueries({ queryKey: ["transfers"] });
            await qc.invalidateQueries({ queryKey: ["categories"] });
        },
    });

    const remove = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/transfers/${id}`);
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["transfers"] });
            await qc.invalidateQueries({ queryKey: ["categories"] });
        },
    });

    const [editId, setEditId] = useState<number | null>(null);

    const update = useMutation({
        mutationFn: async ({ id, amount, description, date }: { id: number; amount: string; description: string | null; date: string }) => {
            await api.put(`/transfers/${id}`, {
                amount: parseAmount(amount),
                description: description || null,
                transferDate: new Date(date).toISOString(),
            });
        },
        onSuccess: async () => {
            setEditId(null);
            await qc.invalidateQueries({ queryKey: ["transfers"] });
            await qc.invalidateQueries({ queryKey: ["categories"] });
        },
    });

    type SortKey = "date" | "from" | "to" | "amount";
    const [sortKey, setSortKey] = useState<SortKey>("date");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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
                        setSortDir(key === "amount" ? "desc" : "asc");
                    }
                }}
                style={{ padding: "6px 10px" }}
            >
                {label} {arrow}
            </button>
        );
    }

    const rows = useMemo(() => {
        const arr = [...(list.data || [])];
        arr.sort((a, b) => {
            if (sortKey === "date") {
                return sortDir === "asc"
                    ? a.transferDate.localeCompare(b.transferDate)
                    : b.transferDate.localeCompare(a.transferDate);
            }
            if (sortKey === "from") {
                const an =
                    categories.data?.find((c) => c.id === a.fromCategoryId)?.name?.toLowerCase() || "";
                const bn =
                    categories.data?.find((c) => c.id === b.fromCategoryId)?.name?.toLowerCase() || "";
                return sortDir === "asc" ? an.localeCompare(bn) : bn.localeCompare(an);
            }
            if (sortKey === "to") {
                const an =
                    categories.data?.find((c) => c.id === a.toCategoryId)?.name?.toLowerCase() || "";
                const bn =
                    categories.data?.find((c) => c.id === b.toCategoryId)?.name?.toLowerCase() || "";
                return sortDir === "asc" ? an.localeCompare(bn) : bn.localeCompare(an);
            }
            return sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
        });
        return arr;
    }, [list.data, sortKey, sortDir, categories.data]);

    const { user } = useAuth();
    const show = user?.showAmounts ?? true;
    const curr = user?.defaultCurrency || "EUR";
    const formatCurrency = (n: number) =>
        new Intl.NumberFormat(undefined, { style: "currency", currency: curr, maximumFractionDigits: 2 }).format(n);

    const countData = useMemo(() => {
        const map = new Map<string, number>();
        (list.data || []).forEach((r) => {
            const d = new Date(r.transferDate);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            map.set(key, (map.get(key) || 0) + 1);
        });
        const keys = Array.from(map.keys()).sort();
        return keys.map((k) => {
            const [y, m] = k.split("-");
            return { name: `${m}/${y.slice(-2)}`, value: map.get(k) || 0 };
        });
    }, [list.data]);

    const Chart =
        countData.length > 0 ? (
            <div className="card" style={{ flex: "0 1 500px", minWidth: 320 }}>
                <h3>Količina prenosov po mesecih</h3>
                <VBarChart data={countData} show={show} formatCurrency={(n) => n.toString()} />
            </div>
        ) : null;

    return (
        <div className="container page">
            <h1>Prenosi</h1>

            <div className="card">
                <div className="toolbar">
                    <select
                        className="input"
                        value={form.fromId}
                        onChange={(e) => setForm({ ...form, fromId: Number(e.target.value) })}
                    >
                        <option value={0}>Iz kategorije</option>
                        {(categories.data || []).map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <select
                        className="input"
                        value={form.toId}
                        onChange={(e) => setForm({ ...form, toId: Number(e.target.value) })}
                    >
                        <option value={0}>V kategorijo</option>
                        {(categories.data || []).map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <input
                        className="input"
                        placeholder="Znesek"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                    <input
                        className="input"
                        placeholder="Opis"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                    <input
                        className="input"
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                    <button disabled={!canSave} onClick={() => create.mutate()}>
                        Prenesi
                    </button>
                </div>
            </div>

            <div className="with-aside-charts">
                <div className="list-column">
                    <div className="card">
                        <table className="table">
                            <thead>
                            <tr>
                                <th>{head("Datum", "date")}</th>
                                <th>{head("Iz kategorije", "from")}</th>
                                <th>{head("V kategorijo", "to")}</th>
                                <th>Opis</th>
                                <th className="right">{head("Znesek", "amount")}</th>
                                <th className="right">Akcije</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map((r) => {
                                const fromName =
                                    categories.data?.find((c) => c.id === r.fromCategoryId)?.name ||
                                    String(r.fromCategoryId);
                                const toName =
                                    categories.data?.find((c) => c.id === r.toCategoryId)?.name ||
                                    String(r.toCategoryId);
                                const inEdit = editId === r.id;
                                if (inEdit) {
                                    const [d, m, y] = formatDateSL(r.transferDate).split("/");
                                    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
                                    return (
                                        <tr key={r.id}>
                                            <td>
                                                <input
                                                    className="input"
                                                    type="date"
                                                    defaultValue={iso}
                                                    id={`d-t-${r.id}`}
                                                />
                                            </td>
                                            <td>{fromName}</td>
                                            <td>{toName}</td>
                                            <td>
                                                <input
                                                    className="input"
                                                    defaultValue={r.description || ""}
                                                    id={`t-t-${r.id}`}
                                                />
                                            </td>
                                            <td className="right">
                                                <input
                                                    className="input"
                                                    defaultValue={String(r.amount)}
                                                    id={`a-t-${r.id}`}
                                                />
                                            </td>
                                            <td className="right row-actions">
                                                <button
                                                    onClick={() =>
                                                        update.mutate({
                                                            id: r.id,
                                                            amount: (document.getElementById(
                                                                `a-t-${r.id}`
                                                            ) as HTMLInputElement).value,
                                                            description: (document.getElementById(
                                                                `t-t-${r.id}`
                                                            ) as HTMLInputElement).value,
                                                            date: (document.getElementById(
                                                                `d-t-${r.id}`
                                                            ) as HTMLInputElement).value,
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
                                    <tr key={r.id}>
                                        <td>{formatDateSL(r.transferDate)}</td>
                                        <td>{fromName}</td>
                                        <td>{toName}</td>
                                        <td>{r.description || ""}</td>
                                        <td className="right">
                                            <Amount value={r.amount} />
                                        </td>
                                        <td className="right row-actions">
                                            <button onClick={() => setEditId(r.id)}>Uredi</button>
                                            <button className="danger" onClick={() => remove.mutate(r.id)}>
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
