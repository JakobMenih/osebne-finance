import { useEffect, useState } from 'react';
import { listUploads, uploadFile, downloadUpload, type Upload } from '../lib/api';

export default function Uploads() {
    const [items, setItems] = useState<Upload[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    async function load() {
        setLoading(true);
        setErr('');
        try {
            const list = await listUploads();
            setItems(list);
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function onUpload() {
        if (!file) return;
        setErr('');
        try {
            await uploadFile(file);
            setFile(null);
            // reload list after upload
            await load();
        } catch (e: any) {
            setErr(e.message);
        }
    }

    async function onDownload(id: string, filename?: string) {
        try {
            const blob = await downloadUpload(id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e: any) {
            setErr(e.message);
        }
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Datoteke</h2>
            {loading && <div>Nalaganje ...</div>}
            {err && <div className="text-red-600 mb-3">{err}</div>}
            <div className="flex items-center gap-2 mb-4">
                <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                />
                <button
                    onClick={onUpload}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                    Naloži
                </button>
            </div>
            <table className="w-full border-collapse">
                <thead>
                <tr className="border-b border-gray-300">
                    <th className="text-left px-2 py-1">Ime datoteke</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {items.map(fileItem => (
                    <tr key={fileItem.id} className="border-t border-gray-200">
                        <td className="px-2 py-1">
                            {fileItem.fileMetadata?.originalName || 'Datoteka'}
                        </td>
                        <td className="px-2 py-1 text-right">
                            <button
                                onClick={() => onDownload(fileItem.id, fileItem.fileMetadata?.originalName)}
                                className="bg-green-500 text-white px-3 py-1 rounded"
                            >
                                Prenesi
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
