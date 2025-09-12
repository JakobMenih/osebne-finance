import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import Amount from "@/components/Amount";
import { formatDateSL, todayISO } from "@/lib/date";
import FileUpload from "@/components/FileUpload";

type Category = { id: number; name: string };
type Row = { id: number; categoryId: number; description?: string; amount: number; transactionDate: string };

type SortKey = "date" | "category" | "amount";
type SortDir = "asc" | "desc";

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
            setForm((x) => ({ ...x, uploads: [u, ...x.uploads] }));
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
                uploadIds: form.uploads.map((u) => u.id)
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
        setEditUploadIds((m) => ({ ...m, [id]: ids }));
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
                                    <td><input className="input" type="date" defaultValue={iso} id={`d-${r.id}`} /></td>
                                    <td>{catName}</td>
                                    <td><input className="input" defaultValue={r.description || ""} id={`t-${r.id}`} /></td>
                                    <td>
                                        <FileUpload
                                            value={editUploadIds[r.id] || []}
                                            onChange={(ids) => setEditUploadIds((m) => ({ ...m, [r.id]: ids }))}
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
