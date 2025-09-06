import { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory, type Category, type CategoryType } from '../lib/api';

export default function Categories() {
    const [items, setItems] = useState<Category[]>([]);
    const [form, setForm] = useState<{ name: string; type: CategoryType }>({
        name: '',
        type: 'expense'
    });
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    async function load() {
        setLoading(true);
        setErr('');
        try {
            const list = await getCategories();
            setItems(list);
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function onCreate() {
        if (!form.name) return;
        setErr('');
        try {
            await createCategory({ name: form.name, type: form.type });
            setForm({ name: '', type: 'expense' });
            await load();
        } catch (e: any) {
            setErr(e.message);
        }
    }

    async function onUpdate(cat: Category) {
        setErr('');
        try {
            await updateCategory(cat.id, { name: cat.name, type: cat.type });
            await load();
        } catch (e: any) {
            setErr(e.message);
        }
    }

    async function onDelete(id: string) {
        setErr('');
        try {
            await deleteCategory(id);
            await load();
        } catch (e: any) {
            setErr(e.message);
        }
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Kategorije</h2>
            {loading && <div>Nalaganje ...</div>}
            {err && <div className="text-red-600 mb-3">{err}</div>}
            <div className="flex gap-2 mb-4">
                <input
                    placeholder="Ime"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="border border-gray-300 rounded px-2 py-1"
                />
                <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as CategoryType })}
                    className="border border-gray-300 rounded px-2 py-1"
                >
                    <option value="expense">expense</option>
                    <option value="income">income</option>
                </select>
                <button
                    onClick={onCreate}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                    Dodaj
                </button>
            </div>
            <table className="w-full border-collapse">
                <thead>
                <tr className="border-b border-gray-300">
                    <th className="text-left px-2 py-1">Ime</th>
                    <th className="text-left px-2 py-1">Tip</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {items.map(cat => (
                    <tr key={cat.id} className="border-t border-gray-200">
                        <td className="px-2 py-1">
                            <input
                                value={cat.name}
                                onChange={e => setItems(prev => prev.map(x => x.id === cat.id ? { ...x, name: e.target.value } : x))}
                                className="border border-gray-300 rounded px-2 py-1 w-full"
                            />
                        </td>
                        <td className="px-2 py-1">
                            <select
                                value={cat.type}
                                onChange={e => setItems(prev => prev.map(x => x.id === cat.id ? { ...x, type: e.target.value as CategoryType } : x))}
                                className="border border-gray-300 rounded px-2 py-1"
                            >
                                <option value="expense">expense</option>
                                <option value="income">income</option>
                            </select>
                        </td>
                        <td className="px-2 py-1 text-right">
                            <button
                                onClick={() => onUpdate(cat)}
                                className="bg-blue-500 text-white px-3 py-1 rounded"
                            >
                                Shrani
                            </button>
                            <button
                                onClick={() => onDelete(cat.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded ml-2"
                            >
                                Izbriši
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
