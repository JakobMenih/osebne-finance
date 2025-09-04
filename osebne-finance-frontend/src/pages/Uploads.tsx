import { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { type Upload, listUploads, uploadFile, deleteUpload, downloadUpload } from '../lib/api';

export default function Uploads() {
    const [file, setFile] = useState<File | null>(null);
    const [items, setItems] = useState<Upload[]>([]);
    const [msg, setMsg] = useState(''); const [err, setErr] = useState('');

    async function load() {
        try { setItems(await listUploads()); } catch (e: any) { setErr(e.message); }
    }
    useEffect(() => { load(); }, []);

    async function onUpload() {
        setMsg(''); setErr('');
        if (!file) return setErr('Izberi datoteko');
        try {
            const res = await uploadFile(file, 'upload');
            setMsg(`Naloženo: ${res.id}`); setFile(null); await load();
        } catch (e: any) { setErr(e.message); }
    }

    async function onDelete(id: string) { await deleteUpload(id); await load(); }

    async function onDownload(id: string, name = 'download.bin') {
        const blob = await downloadUpload(id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = name; a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <>
            <Nav />
            <div style={{ padding: 16 }}>
                <h2>Nalaganja</h2>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input type="file" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)} />
                    <button onClick={onUpload} disabled={!file}>Naloži</button>
                </div>
                {msg && <div style={{ color: 'green' }}>{msg}</div>}
                {err && <div style={{ color: 'crimson' }}>{err}</div>}

                <table cellPadding={6} style={{ borderCollapse: 'collapse', width: '100%', marginTop: 12 }}>
                    <thead><tr><th>ID</th><th>MIME</th><th>Velikost</th><th>Ime</th><th>Čas</th><th></th></tr></thead>
                    <tbody>
                    {items.map(u => (
                        <tr key={u.id} style={{ borderTop: '1px solid #eee' }}>
                            <td>{u.id}</td>
                            <td>{u.fileMetadata?.mimetype || ''}</td>
                            <td>{u.fileMetadata?.size || ''}</td>
                            <td>{u.fileMetadata?.originalName || ''}</td>
                            <td>{new Date(u.createdAt).toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>
                                <button onClick={() => onDownload(u.id, u.fileMetadata?.originalName || 'datoteka.bin')}>Prenesi</button>
                                <button onClick={() => onDelete(u.id)} style={{ marginLeft: 8 }}>Izbriši</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
