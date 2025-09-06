import { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import {
    getAccounts,
    getTransactions,
    getBudgets,
    getCategories,
    type Account,
    type Transaction,
    type Budget,
    type Category
} from '../lib/api';

export default function Dashboard() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [err, setErr] = useState('');

    async function load() {
        try {
            const [acc, trans, bud, cat] = await Promise.all([
                getAccounts(),
                getTransactions(),
                getBudgets(),
                getCategories()
            ]);
            trans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setAccounts(acc);
            setTransactions(trans.slice(0, 5));
            setBudgets(bud);
            setCategories(cat);
        } catch (e: any) {
            setErr(e.message);
        }
    }

    useEffect(() => { load(); }, []);

    return (
        <>
            <Nav />
            <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
                {err && <div className="text-red-500 mb-4">{err}</div>}

                <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Stanje po računih</h3>
                    {accounts.length ? (
                        <ul className="list-none space-y-1">
                            {accounts.map(a => (
                                <li key={a.id}>
                                    {a.name} ({a.type}, {a.currency})
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div>Ni računov.</div>
                    )}
                </div>

                <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Nedavne transakcije</h3>
                    {transactions.length ? (
                        <ul className="list-none space-y-1">
                            {transactions.map(t => (
                                <li key={t.id}>
                                    {t.date.slice(0, 10)}{t.description && ` - ${t.description}`}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div>Ni transakcij.</div>
                    )}
                </div>

                <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Proračuni po kategorijah</h3>
                    {budgets.length ? (
                        <ul className="list-none space-y-1">
                            {budgets.map(b => (
                                <li key={b.id}>
                                    {categories.find(c => c.id === b.categoryId)?.name || b.categoryId}: {b.amount} ({b.periodStart.slice(0, 10)} - {b.periodEnd.slice(0, 10)})
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div>Ni proračunov.</div>
                    )}
                </div>
            </div>
        </>
    );
}
