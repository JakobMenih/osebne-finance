import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDateSL, todayISO } from "@/lib/date";
import Amount from "@/components/Amount";
import FileUpload from "@/components/FileUpload";
import { useAuth } from "@/store/auth";

type Upload = { id: number; file_name?: string; original_name?: string };
type ExpenseRow = {
    id: number;
    categoryId: number;
    amount: number;
    description: string | null;
    transactionDate: string;
};

type Category = { id: number; name: string; description?: string | null; balance?: number | null };

function parseAmount(input: string) {
    const n = Number((input || "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
}

function LineChart({
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
    const stepX = innerW / Math.max(1, data.length - 1);
    const pts = data.map((d, i) => {
        const x = pad + i * stepX;
        const y = pad + innerH - (d.value / max) * innerH;
        return `${x},${y}`;
    });
    return (
        <svg viewBox={`0 0 ${w} ${h}`}>
            <g transform={`translate(${pad},${pad})`}>
                <rect x={-pad} y={-pad} width={w} height={h} fill="transparent" />
            </g>
            <g>
                <polyline
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    points={pts.join(" ")}
                />
                {data.map((d, i) => {
                    const x = pad + i * stepX;
                    const y = pad + innerH - (d.value / max) * innerH;
                    return (
                        <g key={i}>
                            <circle cx={x} cy={y} r="4" fill="#ef4444" />
                            <text x={x} y={h - 6} textAnchor="middle">
                                {d.name}
                            </text>
                            {show && (
                                <text x={x} y={y - 8} textAnchor="middle">
                                    {formatCurrency(d.value)}
                                </text>
                            )}
                        </g>
                    );
                })}
                <g className="tick">
                    <line
                        x1={pad}
                        y1={pad + innerH}
                        x2={pad + innerW}
                        y2={pad + innerH}
                        stroke="#2a3547"
                    />
                    <line x1={pad} y1={pad} x2={pad} y2={pad + innerH} stroke="#2a3547" />
                </g>
            </g>
        </svg>
    );
}

export default function Expenses() {
    const qc = useQueryClient();

    const categories = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => (await api.get("/categories")).data,
    });

    const list = useQuery<ExpenseRow[]>({
        queryKey: ["expenses"],
        queryFn: async () => (await api.get("/expenses")).data,
    });

    const [form, setForm] = useState<{
        categoryId: number;
        amount: string;
        description: string;
        date: string;
        uploads: Upload[];
    }>({ categoryId: 0, amount: "", description: "", date: todayISO(), uploads: [] });

    const canSave = form.categoryId > 0 && parseAmount(form.amount) > 0 && !!form.date;

    async function pickFile() {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.onchange = async () => {
            const files = Array.from(input.files || []);
            if (!files.length) return;
            const uploaded: Upload[] = [];
            for (const f of files) {
                const fd = new FormData();
                fd.append("file", f);
                const res = await api.post("/uploads", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                uploaded.push(res.data);
            }
            setForm((m) => ({ ...m, uploads: [...m.uploads, ...uploaded] }));
        };
        input.click();
    }

    const create = useMutation({
        mutationFn: async () => {
            await api.post("/expenses", {
                categoryId: form.categoryId,
                amount: parseAmount(form.amount),
                description: form.description || null,
                transactionDate: new Date(form.date).toISOString(),
                uploadIds: form.uploads.map((u) => u.id),
            });
        },
        onSuccess: async () => {
            setForm({ categoryId: 0, amount: "", description: "", date: todayISO(), uploads: [] });
            await qc.invalidateQueries({ queryKey: ["expenses"] });
            await qc.invalidateQueries({ queryKey: ["categories"] });
        },
    });

    const remove = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/expenses/${id}`);
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["expenses"] });
            await qc.invalidateQueries({ queryKey: ["categories"] });
        },
    });

    const [editId, setEditId] = useState<number | null>(null);
    const [editUploadIds, setEditUploadIds] = useState<Record<number, number[]>>({});

    const update = useMutation({
        mutationFn: async ({
                               id,
                               amount,
                               description,
                               date,
                               uploadIds,
                           }: {
            id: number;
            amount: string;
            description: string | null;
            date: string;
            uploadIds: number[];
        }) => {
            await api.put(`/expenses/${id}`, {
                amount: parseAmount(amount),
                description: description || null,
                transactionDate: new Date(date).toISOString(),
                uploadIds,
            });
        },
        onSuccess: async () => {
            setEditId(null);
            await qc.invalidateQueries({ queryKey: ["expenses"] });
            await qc.invalidateQueries({ queryKey: ["categories"] });
        },
    });

    type SortKey = "date" | "category" | "amount";
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
                        setSortDir(key === "category" ? "asc" : "desc");
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
                    ? a.transactionDate.localeCompare(b.transactionDate)
                    : b.transactionDate.localeCompare(a.transactionDate);
            }
            if (sortKey === "category") {
                const an =
                    categories.data?.find((c) => c.id === a.categoryId)?.name?.toLowerCase() || "";
                const bn =
                    categories.data?.find((c) => c.id === b.categoryId)?.name?.toLowerCase() || "";
                return sortDir === "asc" ? an.localeCompare(bn) : bn.localeCompare(an);
            }
            return sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
        });
        return arr;
    }, [list.data, sortKey, sortDir, categories.data]);

    const [attachFor, setAttachFor] = useState<number | null>(null);
    const [attachments, setAttachments] = useState<{ id: number; name: string; url: string }[]>([]);

    async function openAttachments(id: number) {
        const res = await api.get(`/expenses/${id}`);
        const ups: Upload[] = res.data?.uploads || [];
        const files: { id: number; name: string; url: string }[] = [];
        for (const u of ups) {
            const file = await api.get(`/uploads/${u.id}/file`, { responseType: "blob" });
            const url = URL.createObjectURL(file.data);
            files.push({ id: u.id, name: u.original_name || u.file_name || `file-${u.id}`, url });
        }
        setAttachments(files);
        setAttachFor(id);
    }

    useEffect(() => {
        return () => {
            attachments.forEach((f) => URL.revokeObjectURL(f.url));
        };
    }, [attachments]);

    const { user } = useAuth();
    const show = user?.showAmounts ?? true;
    const curr = user?.defaultCurrency || "EUR";
    const formatCurrency = (n: number) =>
        new Intl.NumberFormat(undefined, { style: "currency", currency: curr, maximumFractionDigits: 2 }).format(n);

    const monthlyData = useMemo(() => {
        const map = new Map<string, number>();
        (list.data || []).forEach((r) => {
            const d = new Date(r.transactionDate);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const amount = Number(r.amount) || 0;
            map.set(key, (map.get(key) || 0) + amount);
        });
        const keys = Array.from(map.keys()).sort();
        return keys.map((k) => {
            const [y, m] = k.split("-");
            return { name: `${m}/${y.slice(-2)}`, value: map.get(k) || 0 };
        });
    }, [list.data]);

    const Chart =
        monthlyData.length > 0 ? (
            <div className="card" style={{ flex: "0 1 500px", minWidth: 320 }}>
                <h3>Trend odhodkov</h3>
                <LineChart data={monthlyData} show={show} formatCurrency={formatCurrency} />
            </div>
        ) : null;

    return (
        <div className="container page">
            <h1>Odhodki</h1>

            <div className="card">
                <div className="toolbar">
                    <select
                        className="input"
                        value={form.categoryId}
                        onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                    >
                        <option value={0}>Izberi kategorijo</option>
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
                    <div className="actions">
                        <button onClick={pickFile} className="secondary">
                            Pripni
                        </button>
                        <button disabled={!canSave} onClick={() => create.mutate()}>
                            Dodaj
                        </button>
                    </div>
                </div>
                {form.uploads.length > 0 && (
                    <div className="attach" style={{ marginTop: 10 }}>
                        {form.uploads.map((u) => (
                            <span key={u.id} className="badge">
                                {u.file_name || `Slika #${u.id}`}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="with-aside-charts">
                <div className="list-column">
                    <div className="card">
                        <table className="table">
                            <thead>
                            <tr>
                                <th>{head("Datum", "date")}</th>
                                <th>{head("Kategorija", "category")}</th>
                                <th>Opis</th>
                                <th>Priponke</th>
                                <th className="right">{head("Znesek", "amount")}</th>
                                <th className="right">Akcije</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map((r) => {
                                const catName =
                                    categories.data?.find((c) => c.id === r.categoryId)?.name ||
                                    String(r.categoryId);
                                const inEdit = editId === r.id;
                                if (inEdit) {
                                    const [d, m, y] = formatDateSL(r.transactionDate).split("/");
                                    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
                                    return (
                                        <tr key={r.id}>
                                            <td>
                                                <input
                                                    className="input"
                                                    type="date"
                                                    defaultValue={iso}
                                                    id={`d-e-${r.id}`}
                                                />
                                            </td>
                                            <td>{catName}</td>
                                            <td>
                                                <input
                                                    className="input"
                                                    defaultValue={r.description || ""}
                                                    id={`t-e-${r.id}`}
                                                />
                                            </td>
                                            <td>
                                                <FileUpload
                                                    value={editUploadIds[r.id] || []}
                                                    onChange={(ids) =>
                                                        setEditUploadIds((m) => ({ ...m, [r.id]: ids }))
                                                    }
                                                />
                                            </td>
                                            <td className="right">
                                                <input
                                                    className="input"
                                                    defaultValue={String(r.amount)}
                                                    id={`a-e-${r.id}`}
                                                />
                                            </td>
                                            <td className="right row-actions">
                                                <button
                                                    onClick={() =>
                                                        update.mutate({
                                                            id: r.id,
                                                            amount: (document.getElementById(
                                                                `a-e-${r.id}`
                                                            ) as HTMLInputElement).value,
                                                            description: (document.getElementById(
                                                                `t-e-${r.id}`
                                                            ) as HTMLInputElement).value || null,
                                                            date: (document.getElementById(
                                                                `d-e-${r.id}`
                                                            ) as HTMLInputElement).value,
                                                            uploadIds: editUploadIds[r.id] || [],
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
                                        <td>{formatDateSL(r.transactionDate)}</td>
                                        <td>{catName}</td>
                                        <td>{r.description || ""}</td>
                                        <td>
                                            <button className="secondary" onClick={() => openAttachments(r.id)}>
                                                Prikaži
                                            </button>
                                        </td>
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

            {attachFor && (
                <div className="modal" onClick={() => setAttachFor(null)}>
                    <div className="card" onClick={(e) => e.stopPropagation()}>
                        <div className="actions" style={{ justifyContent: "space-between" }}>
                            <h3>Priponke</h3>
                            <button className="secondary" onClick={() => setAttachFor(null)}>
                                Zapri
                            </button>
                        </div>
                        <div className="preview">
                            {attachments.length === 0 && (
                                <span style={{ padding: 8, color: "var(--muted)" }}>Ni priponk</span>
                            )}
                            {attachments.map((a) => (
                                <a key={a.id} href={a.url} target="_blank">
                                    <img src={a.url} />
                                    <span>{a.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
