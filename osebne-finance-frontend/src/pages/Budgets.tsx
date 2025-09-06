import { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import {
    getBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    getCategories,
    type Budget,
    type Category
} from '../lib/api';

export default function Budgets() {
    const [items, setItems] = useState<Budget[]>([]);
    const [cats, setCats] = useState<Category[]>([]);
    const [err, setErr] = useState('');
    const [form, setForm] = useState({
        categoryId: '',
        periodStart: new Date().toISOString().slice(0, 10),
        periodEnd: new Date().toISOString().slice(0, 10),
        amount: 0
    });

    async function load() {
        try {
            const [b, c] = await Promise.all([getBudgets(), getCategories()]);
            setItems(b);
            setCats(c);
            if (!form.categoryId && c.length) {
                setForm(s => ({ ...s, categoryId: c[0].id }));
            }
        } catch (e: any) {
            setErr(e.message);
        }
    }

    useEffect(() => { load(); }, []);

    async function onCreate() {
        await createBudget(form);
        setForm(s => ({ ...s, amount: 0 }));
        await load();
    }
    async function onUpdate(b: Budget) {
        await updateBudget(b.id, { amount: b.amount });
        await load();
    }
    async function onDelete(id: string) {
        await deleteBudget(id);
        await load();
    }

    return (
        <>
            <Nav />
            <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">Proračuni</h2>
                {err && <div className="text-red-500 mb-4">{err}</div>}
                <div className="flex gap-3 my-3">
                    <select
                        className="border rounded px-2 py-1"
                        value={form.categoryId}
                        onChange={e => setForm({ ...form, categoryId: e.target.value })}
                    >
                        {cats.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <input
                        className="border rounded px-2 py-1"
                        type="date"
                        value={form.periodStart}
                        onChange={e => setForm({ ...form, periodStart: e.target.value })}
                    />
                    <input
                        className="border rounded px-2 py-1"
                        type="date"
                        value={form.periodEnd}
                        onChange={e => setForm({ ...form, periodEnd: e.target.value })}
                    />
                    <input
                        className="border rounded px-2 py-1 w-32"
                        type="number"
                        step="0.01"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                    />
                    <button
                        className="bg-blue-500 text-white px-4 py-1 rounded"
                        onClick={onCreate}
                    >
                        Dodaj
                    </button>
                </div>
                <table className="w-full border-collapse">
                    <thead className="border-b">
                    <tr>
                        <th className="text-left font-semibold px-2 py-1">Kategorija</th>
                        <th className="text-left font-semibold px-2 py-1">Od</th>
                        <th className="text-left font-semibold px-2 py-1">Do</th>
                        <th className="text-left font-semibold px-2 py-1">Znesek</th>
                        <th className="px-2 py-1"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {items.map(b => (
                        <tr key={b.id} className="border-b last:border-b-0">
                            <td className="px-2 py-1">
                                {cats.find(c => c.id === b.categoryId)?.name || b.categoryId}
                            </td>
                            <td className="px-2 py-1">{b.periodStart?.slice(0, 10)}</td>
                            <td className="px-2 py-1">{b.periodEnd?.slice(0, 10)}</td>
                            <td className="px-2 py-1">
                                <input
                                    className="border rounded px-2 py-1 w-32"
                                    type="number"
                                    step="0.01"
                                    value={b.amount}
                                    onChange={e =>
                                        setItems(prev => prev.map(x =>
                                            x.id === b.id ? { ...x, amount: Number(e.target.value) } : x
                                        ))
                                    }
                                />
                            </td>
                            <td className="px-2 py-1 text-right">
                                <button
                                    className="bg-blue-500 text-white px-3 py-1 rounded"
                                    onClick={() => onUpdate(b)}
                                >
                                    Shrani
                                </button>
                                <button
                                    className="bg-red-500 text-white px-3 py-1 rounded ml-2"
                                    onClick={() => onDelete(b.id)}
                                >
                                    Izbriši
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
