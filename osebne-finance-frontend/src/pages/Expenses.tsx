import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { uploadFile } from "@/lib/api";
import { formatDateSL, todayISO } from "@/lib/date";
import Amount from "@/components/Amount";

type Category = { id: number; name: string };
type Row = { id: number; categoryId: number; amount: number; description: string | null; transactionDate: string };
type SortKey = "date" | "category" | "amount";
type SortDir = "asc" | "desc";

export default function Expenses() {
    const qc = useQueryClient();
    const [form, setForm] = useState({ categoryId: 0, amount: "", description: "", date: todayISO(), uploadIds: [] as number[], uploads: [] as any[] });
    const [editId, setEditId] = useState<number | null>(null);
    const [attachFor, setAttachFor] = useState<number | null>(null);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [sortKey, setSortKey] = useState<SortKey>("date");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const categories = useQuery({ queryKey: ["categories"], queryFn: async () => (await api.get<Category[]>("/categories")).data });
    const list = useQuery({ queryKey: ["expenses"], queryFn: async () => (await api.get<Row[]>("/expenses")).data });

    const canSave = useMemo(() => Number(form.categoryId) > 0 && !!form.amount, [form]);

    const create = useMutation({
        mutationFn: async () => {
            const body = { categoryId: Number(form.categoryId), amount: Number(String(form.amount).replace(",", ".")), description: form.description || null, transactionDate: new Date(form.date).toISOString(), uploadIds: form.uploadIds };
            return (await api.post("/expenses", body)).data;
        },
        onError: (e: any) => alert(e?.response?.data?.message || "Dodajanje odhodka ni uspelo"),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["expenses"] });
            qc.invalidateQueries({ queryKey: ["categories"] });
            setForm({ categoryId: 0, amount: "", description: "", date: todayISO(), uploadIds: [], uploads: [] });
        }
    });

    const update = useMutation({
        mutationFn: async ({ id, amount, description, date }: { id: number; amount: string; description: string | null; date: string }) => {
            const body = { amount: Number(String(amount).replace(",", ".")), description, transactionDate: new Date(date).toISOString() };
            return (await api.put(`/expenses/${id}`, body)).data;
        },
        onError: (e: any) => alert(e?.response?.data?.message || "Urejanje odhodka ni uspelo"),
        onSuccess: () => {
            setEditId(null);
            qc.invalidateQueries({ queryKey: ["expenses"] });
            qc.invalidateQueries({ queryKey: ["categories"] });
        }
    });

    const remove = useMutation({
        mutationFn: async (id: number) => (await api.delete(`/expenses/${id}`)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["expenses"] });
            qc.invalidateQueries({ queryKey: ["categories"] });
        }
    });

    async function pickFile() {
        const f = document.createElement("input");
        f.type = "file";
        f.accept = "image/png,image/jpeg,image/webp,application/pdf";
        f.onchange = async e => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const u = await uploadFile(file);
            setForm(s => ({ ...s, uploadIds: [...s.uploadIds, u.id], uploads: [...s.uploads, u] }));
        };
        f.click();
    }

    async function openAttachments(id: number) {
        const { data } = await api.get(`/expenses/${id}`);
        const files = data.uploads || [];
        const items = await Promise.all(
            files.map(async (u: any) => {
                const r = await api.get(`/uploads/${u.id}/file`, { responseType: "blob" });
                const blob = new Blob([r.data], { type: r.headers["content-type"] || "application/octet-stream" });
                const url = URL.createObjectURL(blob);
                const isImg = String(r.headers["content-type"] || "").startsWith("image/");
                return { id: u.id, name: u.file_name || u.fileName || `Datoteka #${u.id}`, url, isImg };
            })
        );
        setAttachFor(id);
        setAttachments(items);
    }

    useEffect(() => () => attachments.forEach(a => URL.revokeObjectURL(a.url)), [attachments]);

    function toggleSort(k: SortKey) {
        if (sortKey !== k) {
            setSortKey(k);
            setSortDir(k === "date" ? "desc" : "asc");
        } else {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        }
    }

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

    function head(label: string, key: SortKey) {
        const active = sortKey === key;
        const arrow = active ? (sortDir === "asc" ? "▲" : "▼") : "";
        return <button className="secondary" onClick={() => toggleSort(key)} style={{ padding: "6px 10px" }}>{label} {arrow}</button>;
    }

    return (
        <div className="container page">
            <h1>Odhodki</h1>

            <div className="toolbar">
                <select className="input" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: Number(e.target.value) })}>
                    <option value={0}>Izberi kategorijo</option>
                    {(categories.data || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input className="input" placeholder="Znesek" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                <input className="input" placeholder="Opis" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                <button onClick={pickFile} className="secondary">Pripni</button>
                <button disabled={!canSave} onClick={() => create.mutate()}>Dodaj</button>
            </div>

            {form.uploads.length > 0 && (
                <div className="attach" style={{ margin: "8px 0 16px" }}>
                    {form.uploads.map(u => <span key={u.id} className="badge">{u.file_name || u.fileName || `Datoteka #${u.id}`}</span>)}
                </div>
            )}

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
                    const catName = categories.data?.find(c => c.id === r.categoryId)?.name || r.categoryId;
                    const inEdit = editId === r.id;
                    if (inEdit) {
                        const [d, m, y] = formatDateSL(r.transactionDate).split("/");
                        const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
                        return (
                            <tr key={r.id}>
                                <td><input className="input" type="date" defaultValue={iso} id={`d-e-${r.id}`} /></td>
                                <td>{catName}</td>
                                <td><input className="input" defaultValue={r.description || ""} id={`t-e-${r.id}`} /></td>
                                <td><button className="secondary" onClick={() => openAttachments(r.id)}>Prikaži</button></td>
                                <td className="right"><input className="input" defaultValue={String(r.amount)} id={`a-e-${r.id}`} /></td>
                                <td className="right row-actions">
                                    <button onClick={() => update.mutate({ id: r.id, amount: (document.getElementById(`a-e-${r.id}`) as HTMLInputElement).value, description: (document.getElementById(`t-e-${r.id}`) as HTMLInputElement).value, date: (document.getElementById(`d-e-${r.id}`) as HTMLInputElement).value })}>Shrani</button>
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
                                <button onClick={() => setEditId(r.id)}>Uredi</button>
                                <button className="danger" onClick={() => remove.mutate(r.id)}>Izbriši</button>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>

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
                                    {u.isImg ? <img src={u.url} /> : <div style={{ height: 100, display: "grid", placeItems: "center" }}>Odpri</div>}
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
