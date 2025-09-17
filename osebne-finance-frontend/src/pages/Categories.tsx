import { useMemo, useState } from "react";
import api from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import Amount from "@/components/Amount";

type Category = { id: number; name: string; description?: string; balance?: number };

type SortKey = "name" | "balance";
type SortDir = "asc" | "desc";

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

    return (
        <div className="container page">
            <h1>Kategorije</h1>

            <div className="card">
                <div className="toolbar">
                    <input className="input" placeholder="Ime" value={name} onChange={(e) => setName(e.target.value)} />
                    <input className="input" placeholder="Opis" value={description} onChange={(e) => setDescription(e.target.value)} />
                    <div className="actions">
                        <button onClick={() => create.mutate()} disabled={!name.trim()}>Dodaj kategorijo</button>
                    </div>
                </div>
            </div>

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
                                    <td className="right"><Amount value={c.balance ?? 0} /></td>
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
                                <td className="right"><Amount value={c.balance ?? 0} /></td>
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
    );
}
