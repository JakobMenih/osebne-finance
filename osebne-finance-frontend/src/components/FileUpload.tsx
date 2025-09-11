import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

type UploadMeta = { id: number; file_name: string; file_type: string; file_size: number };

export default function FileUpload({ value, onChange }: { value?: number[]; onChange?: (ids: number[]) => void }) {
    const ids = value ?? [];
    const [files, setFiles] = useState<UploadMeta[]>([]);
    const [urls, setUrls] = useState<Record<number, string>>({});

    async function pick(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        const fd = new FormData();
        fd.append("file", f);
        const r = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
        const u: UploadMeta = r.data;
        setFiles((x) => [u, ...x]);
        const next = [u.id, ...ids];
        onChange?.(next);
        await ensureUrl(u.id);
        e.currentTarget.value = "";
    }

    async function ensureUrl(id: number) {
        if (urls[id]) return;
        const r = await api.get(`/uploads/${id}/file`, { responseType: "blob" });
        const url = URL.createObjectURL(r.data);
        setUrls((m) => ({ ...m, [id]: url }));
    }

    useEffect(() => {
        ids.forEach((id) => ensureUrl(id));
    }, [ids.join(",")]);

    const shown = useMemo(() => files.filter((f) => ids.includes(f.id)), [files, ids]);

    async function open(id: number) {
        await ensureUrl(id);
        const url = urls[id];
        if (url) window.open(url, "_blank");
    }

    return (
        <div className="stack">
            <input type="file" onChange={pick} />
            <div className="preview">
                {ids.map((id) => (
                    <a key={id} onClick={() => open(id)}>
                        {urls[id] ? <img src={urls[id]} /> : <div style={{ height: 100 }} />}
                        <span>{shown.find((x) => x.id === id)?.file_name || `#${id}`}</span>
                    </a>
                ))}
            </div>
        </div>
    );
}
