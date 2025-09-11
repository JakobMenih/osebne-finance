import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Amount from "@/components/Amount";

export default function Categories() {
    const qc = useQueryClient();

    const q = useQuery({
        queryKey: ["categories"],
        queryFn: async () => (await api.get("/categories")).data
    });

    const create = useMutation({
        mutationFn: async (data: any) => (await api.post("/categories", data)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] })
    });

    const update = useMutation({
        mutationFn: async ({ id, ...data }: any) => (await api.put(`/categories/${id}`, data)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] })
    });

    const remove = useMutation({
        mutationFn: async (id: number) => {
            if (!confirm("Želite izbrisati kategorijo?")) return;
            return (await api.delete(`/categories/${id}`)).data;
        },
        onError: (e: any) => alert(e?.response?.data?.message || "Brisanje kategorije ni uspelo"),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] })
    });

    function onCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") || "").trim();
        const description = String(fd.get("description") || "").trim();
        if (!name) return;
        create.mutate({ name, description });
        e.currentTarget.reset();
    }

    return (
        <div className="page">
            <h1>Kategorije</h1>

            <form onSubmit={onCreate} className="toolbar">
                <input name="name" placeholder="Ime kategorije" className="input" />
                <input name="description" placeholder="Opis" className="input" />
                <button className="btn">Ustvari</button>
            </form>

            <div className="list head four">
                <div>Ime</div>
                <div>Opis</div>
                <div className="right">Stanje</div>
                <div />
            </div>

            <div className="list-body">
                {(q.data || []).map((c: any) => (
                    <div key={c.id} className="list row four">
                        <input defaultValue={c.name} onBlur={(e) => update.mutate({ id: c.id, name: e.currentTarget.value })} className="input" />
                        <input defaultValue={c.description || ""} onBlur={(e) => update.mutate({ id: c.id, description: e.currentTarget.value })} className="input" />
                        <div className="right"><Amount value={Number(c.balance || 0)} /></div>
                        <div className="right">
                            <button className="danger" onClick={() => remove.mutate(c.id)}>Izbriši</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
