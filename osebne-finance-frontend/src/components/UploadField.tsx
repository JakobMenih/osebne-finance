import { useState } from "react";
import { uploadFile } from "@/lib/api";

export default function UploadField({ onUploaded }: { onUploaded: (id: number) => void }) {
    const [busy, setBusy] = useState(false);
    const [label, setLabel] = useState("");

    async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        setBusy(true);
        try {
            const u = await uploadFile(f);
            setLabel(u.file_name || f.name);
            if (u.id) onUploaded(u.id);
        } finally {
            setBusy(false);
            e.currentTarget.value = "";
        }
    }

    return (
        <label className="inline-flex items-center gap-2">
            <input type="file" onChange={onChange} disabled={busy} />
            <span>{label || "Naloži datoteko"}</span>
        </label>
    );
}
