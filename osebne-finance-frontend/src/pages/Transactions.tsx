import { useEffect, useState } from 'react';
import { getTransactions, getAccounts, getLines, createTransaction, deleteTransaction, type Transaction, type Account } from '../lib/api';

export default function Transactions() {
    const [items, setItems] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [totals, setTotals] = useState<Record<string, { amount: number; currency: string }>>({});
    const [form, setForm] = useState<{ description: string; date: string; amount: string; accountId: string }>({
        description: '',
        date: '',
        amount: '',
        accountId: ''
    });
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setErr('');
            try {
                const [txList, accList] = await Promise.all([getTransactions(), getAccounts()]);
                setItems(txList);
                setAccounts(accList);
                if (accList.length > 0) {
                    setForm(prev => ({ ...prev, accountId: accList[0].id }));
                }
                // Fetch transaction lines and calculate totals for each transaction
                const totalsMap: Record<string, { amount: number; currency: string }> = {};
                await Promise.all(txList.map(async (t) => {
                    const lines = await getLines(t.id);
                    let total = 0;
                    let currency = '';
                    lines.forEach(line => {
                        total += line.amount;
                        currency = line.currency;
                    });
                    totalsMap[t.id] = { amount: total, currency };
                }));
                setTotals(totalsMap);
            } catch (e: any) {
                setErr(e.message);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    async function onCreate() {
        if (!form.description || !form.date || !form.amount || !form.accountId) return;
        setErr('');
        try {
            const account = accounts.find(a => a.id === form.accountId);
            if (!account) throw new Error('Izberi račun');
            const newTransaction = {
                date: form.date,
                description: form.description,
                lines: [
                    {
                        accountId: account.id,
                        kind: 'out',
                        amount: parseFloat(form.amount),
                        currency: account.currency
                    }
                ]
            };
            await createTransaction(newTransaction);
            setForm({ description: '', date: '', amount: '', accountId: account.id });
            // Reload transactions list
            const txList = await getTransactions();
            setItems(txList);
            const totalsMap: Record<string, { amount: number; currency: string }> = {};
            await Promise.all(txList.map(async (t) => {
                const lines = await getLines(t.id);
                let total = 0;
                let currency = '';
                lines.forEach(line => {
                    total += line.amount;
                    currency = line.currency;
                });
                totalsMap[t.id] = { amount: total, currency };
            }));
            setTotals(totalsMap);
        } catch (e: any) {
            setErr(e.message);
        }
    }

    async function onDelete(id: string) {
        try {
            await deleteTransaction(id);
            // Refresh list after deletion
            const txList = await getTransactions();
            setItems(txList);
            const totalsMap: Record<string, { amount: number; currency: string }> = {};
            await Promise.all(txList.map(async (t) => {
                const lines = await getLines(t.id);
                let total = 0;
                let currency = '';
                lines.forEach(line => {
                    total += line.amount;
                    currency = line.currency;
                });
                totalsMap[t.id] = { amount: total, currency };
            }));
            setTotals(totalsMap);
        } catch (e: any) {
            setErr(e.message);
        }
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Transakcije</h2>
            {loading && <div>Nalaganje ...</div>}
            {err && <div className="text-red-600 mb-3">{err}</div>}
            <div className="flex gap-2 mb-4">
                <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    placeholder="Datum"
                    className="border border-gray-300 rounded px-2 py-1"
                />
                <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Opis"
                    className="border border-gray-300 rounded px-2 py-1"
                />
                <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="Znesek"
                    className="border border-gray-300 rounded px-2 py-1 w-28 text-right"
                />
                <select
                    value={form.accountId}
                    onChange={e => setForm({ ...form, accountId: e.target.value })}
                    className="border border-gray-300 rounded px-2 py-1"
                >
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.currency})
                        </option>
                    ))}
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
                    <th className="text-left px-2 py-1">Datum</th>
                    <th className="text-left px-2 py-1">Opis</th>
                    <th className="text-left px-2 py-1">Znesek</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {items.map(t => (
                    <tr key={t.id} className="border-t border-gray-200">
                        <td className="px-2 py-1">{t.date}</td>
                        <td className="px-2 py-1">{t.description}</td>
                        <td className="px-2 py-1">
                            {totals[t.id] ? `${totals[t.id].amount} ${totals[t.id].currency}` : ''}
                        </td>
                        <td className="px-2 py-1 text-right">
                            <button
                                onClick={() => onDelete(t.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded"
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
