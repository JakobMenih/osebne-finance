import { useEffect, useState } from 'react';
import { getAccounts, createAccount, updateAccount, deleteAccount, type Account, type AccountType } from '../lib/api';

export default function Accounts() {
    const [items, setItems] = useState<Account[]>([]);
    const [form, setForm] = useState<{ name: string; type: AccountType; currency: string }>({
        name: '',
        type: 'checking',
        currency: 'EUR'
    });
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    async function load() {
        setLoading(true);
        setErr('');
        try {
            const list = await getAccounts();
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
            await createAccount(form);
            setForm({ name: '', type: 'checking', currency: 'EUR' });
            await load();
        } catch (e: any) {
            setErr(e.message);
        }
    }

    async function onUpdate(item: Account) {
        setErr('');
        try {
            await updateAccount(item.id, { name: item.name, type: item.type, currency: item.currency });
            await load();
        } catch (e: any) {
            setErr(e.message);
        }
    }

    async function onDelete(id: string) {
        setErr('');
        try {
            await deleteAccount(id);
            await load();
        } catch (e: any) {
            setErr(e.message);
        }
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Računi</h2>
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
                    onChange={e => setForm({ ...form, type: e.target.value as AccountType })}
                    className="border border-gray-300 rounded px-2 py-1"
                >
                    <option value="checking">checking</option>
                    <option value="savings">savings</option>
                    <option value="cash">cash</option>
                </select>
                <input
                    placeholder="Valuta"
                    value={form.currency}
                    onChange={e => setForm({ ...form, currency: e.target.value })}
                    className="border border-gray-300 rounded px-2 py-1 w-20"
                />
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
                    <th className="text-left px-2 py-1">Valuta</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {items.map(acc => (
                    <tr key={acc.id} className="border-t border-gray-200">
                        <td className="px-2 py-1">
                            <input
                                value={acc.name}
                                onChange={e => setItems(prev => prev.map(x => x.id === acc.id ? { ...x, name: e.target.value } : x))}
                                className="border border-gray-300 rounded px-2 py-1 w-full"
                            />
                        </td>
                        <td className="px-2 py-1">
                            <select
                                value={acc.type}
                                onChange={e => setItems(prev => prev.map(x => x.id === acc.id ? { ...x, type: e.target.value as AccountType } : x))}
                                className="border border-gray-300 rounded px-2 py-1"
                            >
                                <option value="checking">checking</option>
                                <option value="savings">savings</option>
                                <option value="cash">cash</option>
                            </select>
                        </td>
                        <td className="px-2 py-1">
                            <input
                                value={acc.currency}
                                onChange={e => setItems(prev => prev.map(x => x.id === acc.id ? { ...x, currency: e.target.value } : x))}
                                className="border border-gray-300 rounded px-2 py-1 w-20"
                            />
                        </td>
                        <td className="px-2 py-1 text-right">
                            <button
                                onClick={() => onUpdate(acc)}
                                className="bg-blue-500 text-white px-3 py-1 rounded"
                            >
                                Shrani
                            </button>
                            <button
                                onClick={() => onDelete(acc.id)}
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
