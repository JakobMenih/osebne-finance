import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDateSL, todayISO } from "@/lib/date";
import Amount from "@/components/Amount";

type Category = { id: number; name: string };
type Row = { id: number; fromCategoryId: number; toCategoryId: number; amount: number; description: string | null; transferDate: string };

type SortKey = "date" | "from" | "to" | "amount";
type SortDir = "asc" | "desc";

export default function Transfers() {
    const qc = useQueryClient();
    const [form, setForm] = useState({ fromId: 0, toId: 0, amount: "", description: "", date: todayISO() });
    const [editId, setEditId] = useState<number | null>(null);

    const [sortKey, setSortKey] = useState<SortKey>("date");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const categories = useQuery({ queryKey: ["categories"], queryFn: async () => (await api.get<Category[]>("/categories")).data });
    const list = useQuery({ queryKey: ["transfers"], queryFn: async () => (await api.get<Row[]>("/transfers")).data });

    const canSave = useMemo(() => Number(form.fromId) > 0 && Number(form.toId) > 0 && !!form.amount && form.fromId !== form.toId, [form]);

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

    const nameOf = (id: number) => categories.data?.find(c => c.id === id)?.name?.toLowerCase() || "";

    const rows = useMemo(() => {
        const arr = [...(list.data || [])];
        arr.sort((a, b) => {
            if (sortKey === "date") {
                const av = new Date(a.transferDate).getTime();
                const bv = new Date(b.transferDate).getTime();
                return sortDir === "asc" ? av - bv : bv - av;
            }
            if (sortKey === "from") {
                const av = nameOf(a.fromCategoryId);
                const bv = nameOf(b.fromCategoryId);
                return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            }
            if (sortKey === "to") {
                const av = nameOf(a.toCategoryId);
                const bv = nameOf(b.toCategoryId);
                return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            }
            const av = Number(a.amount);
            const bv = Number(b.amount);
            return sortDir === "asc" ? av - bv : bv - av;
        });
        return arr;
    }, [list.data, sortKey, sortDir, categories.data]);

    const create = useMutation({
        mutationFn: async () => {
            const body = {
                fromCategoryId: Number(form.fromId),
                toCategoryId: Number(form.toId),
                amount: Number(String(form.amount).replace(",", ".")),
                description: form.description || null,
                transferDate: new Date(form.date).toISOString()
            };
            return (await api.post("/transfers", body)).data;
        },
        onError: (e: any) => alert(e?.response?.data?.message || "Prenos ni uspel"),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["transfers"] });
            qc.invalidateQueries({ queryKey: ["categories"] });
            setForm({ fromId: 0, toId: 0, amount: "", description: "", date: todayISO() });
        }
    });

    const update = useMutation({
        mutationFn: async ({ id, amount, description, date }: { id: number; amount: string; description: string | null; date: string }) => {
            const body = { amount: Number(String(amount).replace(",", ".")), description, transferDate: new Date(date).toISOString() };
            return (await api.put(`/transfers/${id}`, body)).data;
        },
        onError: (e: any) => alert(e?.response?.data?.message || "Urejanje prenosa ni uspelo"),
        onSuccess: () => {
            setEditId(null);
            qc.invalidateQueries({ queryKey: ["transfers"] });
            qc.invalidateQueries({ queryKey: ["categories"] });
        }
    });

    const remove = useMutation({
        mutationFn: async (id: number) => (await api.delete(`/transfers/${id}`)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["transfers"] });
            qc.invalidateQueries({ queryKey: ["categories"] });
        }
    });

    return (
        <div className="container page">
            <h1>Prenosi</h1>

            <div className="card">
                <div className="toolbar">
                    <select className="input" value={form.fromId} onChange={e => setForm({ ...form, fromId: Number(e.target.value) })}>
                        <option value={0}>Iz kategorije</option>
                        {(categories.data || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select className="input" value={form.toId} onChange={e => setForm({ ...form, toId: Number(e.target.value) })}>
                        <option value={0}>V kategorijo</option>
                        {(categories.data || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input className="input" placeholder="Znesek" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                    <input className="input" placeholder="Opis" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    <button disabled={!canSave} onClick={() => create.mutate()}>Prenesi</button>
                </div>
            </div>

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
                    {rows.map(r => {
                        const fromName = categories.data?.find(c => c.id === r.fromCategoryId)?.name || r.fromCategoryId;
                        const toName = categories.data?.find(c => c.id === r.toCategoryId)?.name || r.toCategoryId;
                        const inEdit = editId === r.id;
                        if (inEdit) {
                            const [d, m, y] = formatDateSL(r.transferDate).split("/");
                            const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
                            return (
                                <tr key={r.id}>
                                    <td><input className="input" type="date" defaultValue={iso} id={`d-t-${r.id}`} /></td>
                                    <td>{fromName}</td>
                                    <td>{toName}</td>
                                    <td><input className="input" defaultValue={r.description || ""} id={`t-t-${r.id}`} /></td>
                                    <td className="right"><input className="input" defaultValue={String(r.amount)} id={`a-t-${r.id}`} /></td>
                                    <td className="right row-actions">
                                        <button onClick={() => update.mutate({ id: r.id, amount: (document.getElementById(`a-t-${r.id}`) as HTMLInputElement).value, description: (document.getElementById(`t-t-${r.id}`) as HTMLInputElement).value, date: (document.getElementById(`d-t-${r.id}`) as HTMLInputElement).value })}>Shrani</button>
                                        <button className="secondary" onClick={() => setEditId(null)}>Prekliči</button>
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
            </div>
        </div>
    );
}
