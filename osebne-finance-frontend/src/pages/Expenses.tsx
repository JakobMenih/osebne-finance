import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Amount from "@/components/Amount";
import api from "@/lib/api";
import {formatDateSL, todayISO} from "@/lib/date";
import FileUpload from "@/components/FileUpload";

type Category = { id: number; name: string };
type Row = { id: number; categoryId: number; amount: number; description: string | null; transactionDate: string };

type SortKey = "date" | "category" | "amount";
type SortDir = "asc" | "desc";

export default function Expenses() {
    const qc = useQueryClient();

    const categories = useQuery({
        queryKey: ["categories"],
        queryFn: async () => (await api.get<Category[]>("/categories")).data
    });

    const list = useQuery({
        queryKey: ["expenses"],
        queryFn: async () => (await api.get<Row[]>("/expenses")).data
    });

    const [form, setForm] = useState({
        categoryId: 0,
        amount: "",
        description: "",
        date: todayISO(),
        uploads: [] as { id: number; file_name?: string }[]
    });

    const [sortKey, setSortKey] = useState<SortKey>("date");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const [editId, setEditId] = useState<number | null>(null);
    const [editUploadIds, setEditUploadIds] = useState<Record<number, number[]>>({});

    const [attachFor, setAttachFor] = useState<number | null>(null);
    const [attachments, setAttachments] = useState<{ id: number; name: string; url: string }[]>([]);

    const canSave = Number(form.categoryId) > 0 && !!form.amount && !!form.date;

    function toggleSort(k: SortKey) {
        if (sortKey !== k) {
            setSortKey(k);
            setSortDir(k === "date" ? "desc" : "asc");
        } else {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        }
    }

    function head(label: string, key: SortKey) {
        const active = sortKey === key;
        const arrow = active ? (sortDir === "asc" ? "▲" : "▼") : "⇅";
        return (
            <button className="secondary" onClick={() => toggleSort(key)} style={{ padding: "6px 10px" }}>
                {label} {arrow}
            </button>
        );
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

    async function pickFile() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async e => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.append("file", file);
            const r = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
            const u = r.data as { id: number; file_name?: string };
            setForm(s => ({ ...s, uploads: [u, ...s.uploads] }));
        };
        input.click();
    }

    const create = useMutation({
        mutationFn: async () => {
            const body = {
                categoryId: Number(form.categoryId),
                amount: Number(String(form.amount).replace(",", ".")),
                description: form.description || null,
                transactionDate: new Date(form.date).toISOString(),
                uploadIds: form.uploads.map(u => u.id)
            };
            return (await api.post("/expenses", body)).data;
        },
        onSuccess: () => {
            setForm({ categoryId: 0, amount: "", description: "", date: todayISO(), uploads: [] });
            qc.invalidateQueries({ queryKey: ["expenses"] });
            qc.invalidateQueries({ queryKey: ["categories"] });
        }
    });

    const update = useMutation({
        mutationFn: async (p: { id: number; amount: string; description: string | null; date: string; uploadIds: number[] }) => {
            const body = {
                amount: Number(String(p.amount).replace(",", ".")),
                description: p.description,
                transactionDate: new Date(p.date).toISOString(),
                uploadIds: p.uploadIds
            };
            return (await api.put(`/expenses/${p.id}`, body)).data;
        },
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

    async function openAttachments(id: number) {
        const { data } = await api.get(`/expenses/${id}`);
        const files = data.uploads || [];
        const items = await Promise.all(
            files.map(async (u: any) => {
                const r = await api.get(`/uploads/${u.id}/file`, { responseType: "blob" });
                const blob = new Blob([r.data], { type: r.headers["content-type"] || "image/*" });
                const url = URL.createObjectURL(blob);
                return { id: u.id, name: u.file_name || `Slika #${u.id}`, url };
            })
        );
        setAttachments(items);
        setAttachFor(id);
    }

    useEffect(() => {
        return () => attachments.forEach(a => URL.revokeObjectURL(a.url));
    }, [attachments]);

    async function startEdit(id: number) {
        setEditId(id);
        const r = await api.get(`/expenses/${id}`);
        const ids: number[] = (r.data?.uploads || []).map((u: any) => u.uploadId || u.id);
        setEditUploadIds(m => ({ ...m, [id]: ids }));
    }

    return (
        <div className="container page">
            <h1>Odhodki</h1>

            <div className="card">
                <div className="toolbar">
                    <select className="input" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: Number(e.target.value) })}>
                        <option value={0}>Izberi kategorijo</option>
                        {(categories.data || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input className="input" placeholder="Znesek" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                    <input className="input" placeholder="Opis" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    <button onClick={pickFile} className="secondary">Pripni sliko</button>
                    <button disabled={!canSave} onClick={() => create.mutate()}>Dodaj</button>
                </div>
                {form.uploads.length > 0 && (
                    <div className="attach" style={{ marginTop: 8 }}>
                        {form.uploads.map(u => <span key={u.id} className="badge">{u.file_name || `Slika #${u.id}`}</span>)}
                    </div>
                )}
            </div>

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
                                    <td>
                                        <FileUpload
                                            value={editUploadIds[r.id] || []}
                                            onChange={(ids) => setEditUploadIds(m => ({ ...m, [r.id]: ids }))}
                                        />
                                    </td>
                                    <td className="right"><input className="input" defaultValue={String(r.amount)} id={`a-e-${r.id}`} /></td>
                                    <td className="right row-actions">
                                        <button onClick={() => update.mutate({
                                            id: r.id,
                                            amount: (document.getElementById(`a-e-${r.id}`) as HTMLInputElement).value,
                                            description: (document.getElementById(`t-e-${r.id}`) as HTMLInputElement).value || null,
                                            date: (document.getElementById(`d-e-${r.id}`) as HTMLInputElement).value,
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

            {attachFor && (
                <div className="modal" onClick={() => setAttachFor(null)}>
                    <div className="card" onClick={e => e.stopPropagation()}>
                        <div className="actions" style={{ justifyContent: "space-between" }}>
                            <h3>Priponke</h3>
                            <button className="secondary" onClick={() => setAttachFor(null)}>Zapri</button>
                        </div>
                        <div className="preview">
                            {attachments.length === 0 && <span style={{ padding: 8, color: "var(--muted)" }}>Ni priponk</span>}
                            {attachments.map(a => (
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
