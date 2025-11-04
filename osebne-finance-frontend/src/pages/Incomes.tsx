import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import Amount from "@/components/Amount";
import { formatDateSL, todayISO } from "@/lib/date";
import FileUpload from "@/components/FileUpload";
import { useAuth } from "@/store/auth";

type Category = { id: number; name: string };
type Row = { id: number; categoryId: number; description?: string | null; amount: number; transactionDate: string };

type SortKey = "date" | "category" | "amount";
type SortDir = "asc" | "desc";

type Point = { x: number; y: number };

function LineChart({ data, show, formatCurrency }: { data: { month: string; total: number }[]; show: boolean; formatCurrency: (v: number) => string }) {
    const width = 600;
    const height = 260;
    const padding = 36;
    const xs: string[] = data.map(d => d.month);
    const ys: number[] = data.map(d => d.total);
    const minY = ys.length ? Math.min(...ys) : 0;
    const maxY = ys.length ? Math.max(...ys) : 1;
    const y0 = minY === maxY ? 0 : minY > 0 ? 0 : minY;
    const y1 = maxY === minY ? maxY + 1 : maxY;
    const scaleX = (i: number) => {
        if (data.length <= 1) return padding + (width - 2 * padding) / 2;
        const t = i / (data.length - 1);
        return padding + t * (width - 2 * padding);
    };
    const scaleY = (v: number) => {
        const t = (v - y0) / (y1 - y0);
        return height - padding - t * (height - 2 * padding);
    };
    const points: Point[] = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.total) }));
    const dAttr =
        points.length === 0
            ? ""
            : "M " + points.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L ");
    const ticks = 4;
    const yTicks: number[] = Array.from({ length: ticks + 1 }, (_, i) => y0 + (i * (y1 - y0)) / ticks);
    const monthLabel = (m: string) => {
        const [yy, mm] = m.split("-");
        return `${mm}/${yy}`;
    };
    return (
        <div style={{ width: "100%" }}>
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
                <rect x="0" y="0" width={width} height={height} fill="none" />
                {yTicks.map((t, i) => {
                    const y = scaleY(t);
                    return (
                        <g key={i}>
                            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeDasharray="3 3" />
                            <text x={8} y={y + 4} fontSize="10" fill="#6b7280">{show ? formatCurrency(t) : ""}</text>
                        </g>
                    );
                })}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#9ca3af" />
                {xs.map((m, i) => {
                    const x = scaleX(i);
                    return (
                        <text key={m + i} x={x} y={height - padding + 14} fontSize="10" fill="#6b7280" textAnchor="middle">
                            {monthLabel(m)}
                        </text>
                    );
                })}
                <path d={dAttr} stroke="#6366f1" strokeWidth="2" fill="none" />
                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="3" fill="#6366f1" />
                        <title>{show ? formatCurrency(data[i].total) : "****"}</title>
                    </g>
                ))}
            </svg>
        </div>
    );
}

export default function Incomes() {
    const [form, setForm] = useState({ categoryId: 0, amount: "", description: "", date: todayISO(), uploads: [] as { id: number; file_name?: string }[] });
    const [sortKey, setSortKey] = useState<SortKey>("date");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [editId, setEditId] = useState<number | null>(null);
    const [editUploadIds, setEditUploadIds] = useState<Record<number, number[]>>({});
    const [attachFor, setAttachFor] = useState<number | null>(null);
    const [attachments, setAttachments] = useState<Array<{ id: number; name: string; url: string }>>([]);

    const categories = useQuery<Category[]>({ queryKey: ["categories"], queryFn: async () => (await api.get("/categories")).data });
    const list = useQuery<Row[]>({ queryKey: ["incomes"], queryFn: async () => (await api.get("/incomes")).data });

    const rows = useMemo(() => {
        const arr = [...(list.data || [])];
        const byCat = (id: number) => categories.data?.find(c => c.id === id)?.name?.toLowerCase() || "";
        arr.sort((a, b) => {
            if (sortKey === "date") {
                const av = new Date(a.transactionDate).getTime();
                const bv = new Date(b.transactionDate).getTime();
                return sortDir === "asc" ? av - bv : bv - av;
            }
            if (sortKey === "category") {
                const av = byCat(a.categoryId);
                const bv = byCat(b.categoryId);
                return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            }
            const av = Number(a.amount);
            const bv = Number(b.amount);
            return sortDir === "asc" ? av - bv : bv - av;
        });
        return arr;
    }, [list.data, sortKey, sortDir, categories.data]);

    const canSave = form.categoryId > 0 && Number(form.amount) > 0 && !!form.date;

    async function pickFile() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
            const f = input.files?.[0];
            if (!f) return;
            const fd = new FormData();
            fd.append("file", f);
            const r = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
            const u = r.data as { id: number; file_name: string };
            setForm(x => ({ ...x, uploads: [u, ...x.uploads] }));
        };
        input.click();
    }

    const create = useMutation({
        mutationFn: async () => {
            const r = await api.post("/incomes", {
                categoryId: form.categoryId,
                amount: Number(form.amount),
                description: form.description || null,
                date: form.date,
                uploadIds: form.uploads.map(u => u.id)
            });
            return r.data;
        },
        onSuccess: () => {
            setForm({ categoryId: 0, amount: "", description: "", date: todayISO(), uploads: [] });
            list.refetch();
        }
    });

    const update = useMutation({
        mutationFn: async (p: { id: number; amount: string; description: string; date: string; uploadIds?: number[] }) => {
            const r = await api.put(`/incomes/${p.id}`, {
                amount: Number(p.amount),
                description: p.description || null,
                date: p.date,
                uploadIds: p.uploadIds
            });
            return r.data;
        },
        onSuccess: () => {
            setEditId(null);
            list.refetch();
        }
    });

    const remove = useMutation({
        mutationFn: async (id: number) => (await api.delete(`/incomes/${id}`)).data,
        onSuccess: () => list.refetch()
    });

    function head(label: string, key: SortKey) {
        const active = sortKey === key;
        const arrow = active ? (sortDir === "asc" ? "▲" : "▼") : "⇅";
        return (
            <button className="secondary" onClick={() => {
                if (sortKey !== key) { setSortKey(key); setSortDir(key === "date" ? "desc" : "asc"); }
                else { setSortDir(sortDir === "asc" ? "desc" : "asc"); }
            }} style={{ padding: "6px 10px" }}>
                {label} {arrow}
            </button>
        );
    }

    async function startEdit(id: number) {
        setEditId(id);
        const r = await api.get(`/incomes/${id}`);
        const ids: number[] = (r.data?.uploads || []).map((u: any) => u.uploadId || u.id);
        setEditUploadIds(m => ({ ...m, [id]: ids }));
    }

    async function openAttachments(id: number) {
        const { data } = await api.get(`/incomes/${id}`);
        const files = data.uploads || [];
        const items = await Promise.all(
            files.map(async (u: any) => {
                const r = await api.get(`/uploads/${u.id}/file`, { responseType: "blob" });
                const blob = new Blob([r.data], { type: r.headers["content-type"] || "image/*" });
                const url = URL.createObjectURL(blob);
                return { id: u.id, name: u.file_name || u.fileName || `Slika #${u.id}`, url };
            })
        );
        setAttachFor(id);
        setAttachments(items);
    }

    useEffect(() => () => attachments.forEach(a => URL.revokeObjectURL(a.url)), [attachments]);

    const { user } = useAuth();
    const show = user?.showAmounts ?? true;
    const curr = user?.defaultCurrency || "EUR";

    const monthlyData = useMemo(() => {
        if (!list.data) return [];
        const sums = new Map<string, number>();
        for (const r of list.data) {
            const dt = new Date(r.transactionDate);
            const m = dt.toISOString().slice(0, 7);
            sums.set(m, (sums.get(m) || 0) + r.amount);
        }
        const result = Array.from(sums, ([month, total]) => ({ month, total }));
        result.sort((a, b) => a.month.localeCompare(b.month));
        return result;
    }, [list.data]);

    const formatCurrency = (val: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: curr, maximumFractionDigits: 2 }).format(val);
    const Chart = monthlyData.length > 0 ? (
        <div className="card" style={{ flex: "0 1 420px", minWidth: 280 }}>
            <h3>Trend prihodkov</h3>
            <LineChart data={monthlyData} show={show} formatCurrency={formatCurrency} />
        </div>
    ) : null;

    return (
        <div className="container page">
            <h1>Prihodki</h1>

            <div className="card">
                <div className="toolbar">
                    <select className="input" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: Number(e.target.value) })}>
                        <option value={0}>Izberi kategorijo</option>
                        {(categories.data || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input className="input" placeholder="Znesek" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                    <input className="input" placeholder="Opis" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    <div className="actions">
                        <button onClick={pickFile} className="secondary">Pripni</button>
                        <button disabled={!canSave} onClick={() => create.mutate()}>Dodaj</button>
                    </div>
                </div>
                {form.uploads.length > 0 && (
                    <div className="attach" style={{ marginTop: 10 }}>
                        {form.uploads.map(u => <span key={u.id} className="badge">{u.file_name || `Slika #${u.id}`}</span>)}
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
                            {rows.map(r => {
                                const catName = categories.data?.find(c => c.id === r.categoryId)?.name || String(r.categoryId);
                                const inEdit = editId === r.id;
                                if (inEdit) {
                                    const [d, m, y] = formatDateSL(r.transactionDate).split("/");
                                    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
                                    return (
                                        <tr key={r.id}>
                                            <td><input className="input" type="date" defaultValue={iso} id={`d-${r.id}`} /></td>
                                            <td>{catName}</td>
                                            <td><input className="input" defaultValue={r.description || ""} id={`t-${r.id}`} /></td>
                                            <td>
                                                <FileUpload
                                                    value={editUploadIds[r.id] || []}
                                                    onChange={(ids) => setEditUploadIds(m => ({ ...m, [r.id]: ids }))}
                                                />
                                            </td>
                                            <td className="right"><input className="input" defaultValue={String(r.amount)} id={`a-${r.id}`} /></td>
                                            <td className="right row-actions">
                                                <button onClick={() => update.mutate({
                                                    id: r.id,
                                                    amount: (document.getElementById(`a-${r.id}`) as HTMLInputElement).value,
                                                    description: (document.getElementById(`t-${r.id}`) as HTMLInputElement).value,
                                                    date: (document.getElementById(`d-${r.id}`) as HTMLInputElement).value,
                                                    uploadIds: editUploadIds[r.id] || []
                                                })}>Shrani</button>
                                                <button className="secondary" onClick={() => setEditId(null)}>Prekliči</button>
                                            </td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr key={r.id}>
                                        <td>{formatDateSL(r.transactionDate)}</td>
                                        <td>{catName}</td>
                                        <td>{r.description || ""}</td>
                                        <td><button className="secondary" onClick={() => openAttachments(r.id)}>Prikaži</button></td>
                                        <td className="right"><Amount value={r.amount} /></td>
                                        <td className="right row-actions">
                                            <button onClick={() => startEdit(r.id)}>Uredi</button>
                                            <button className="danger" onClick={() => remove.mutate(r.id)}>Izbriši</button>
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

            {attachFor && (
                <div className="modal" onClick={() => setAttachFor(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3>Priponke</h3>
                            <button className="secondary" onClick={() => setAttachFor(null)}>Zapri</button>
                        </div>
                        <div className="preview">
                            {attachments.length === 0 && <span style={{ padding: 8, color: "var(--muted)" }}>Ni priponk</span>}
                            {attachments.map(u => (
                                <a key={u.id} href={u.url} target="_blank">
                                    <img src={u.url} />
                                    <span>{u.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
