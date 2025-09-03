import { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { useParams } from 'react-router-dom';
import {
    getTransaction,
    getLines,
    createLine,
    deleteLine,
    getAccounts,
    getCategories,
    type Transaction, type TransactionLine, type Account, type Category
} from '../lib/api';

export default function TransactionDetails() {
    const { id = '' } = useParams();
    const [tx, setTx] = useState<Transaction | null>(null);
    const [lines, setLines] = useState<TransactionLine[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [err, setErr] = useState('');
    const [form, setForm] = useState<{accountId:string; categoryId?:string; amount:number; description?:string}>({ accountId:'', categoryId:'', amount:0, description:'' });

    async function load() {
        try {
            const [t, l, a, c] = await Promise.all([getTransaction(id), getLines(id), getAccounts(), getCategories()]);
            setTx(t); setLines(l); setAccounts(a); setCategories(c);
            if (!form.accountId && a[0]) setForm(s=>({ ...s, accountId: a[0].id }));
        } catch(e:any){ setErr(e.message); }
    }
    useEffect(()=>{ load(); }, [id]);

    async function onAdd() {
        if (!form.accountId || !form.amount) return;
        await createLine({ transactionId: id, accountId: form.accountId, categoryId: form.categoryId || undefined, amount: Number(form.amount), description: form.description || undefined });
        setForm(s=>({ ...s, amount: 0, description:'' })); await load();
    }
    async function onDelete(lineId: string) { await deleteLine(lineId); await load(); }

    return (
        <>
            <Nav />
            <div style={{ padding:16 }}>
                <h2>Postavke</h2>
                {tx && <div style={{ marginBottom:8 }}>{tx.date?.slice(0,10)} — {tx.description || ''}</div>}
                {err && <div style={{ color:'crimson' }}>{err}</div>}

                <div style={{ display:'flex', gap:8, margin:'12px 0' }}>
                    <select value={form.accountId} onChange={e=>setForm({...form, accountId: e.target.value})}>
                        {accounts.map(a=><option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                    </select>
                    <select value={form.categoryId || ''} onChange={e=>setForm({...form, categoryId: e.target.value || undefined})}>
                        <option value="">brez kategorije</option>
                        {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="number" step="0.01" value={form.amount} onChange={e=>setForm({...form, amount: Number(e.target.value)})} style={{ width:120 }} />
                    <input placeholder="Opis" value={form.description || ''} onChange={e=>setForm({...form, description: e.target.value})} />
                    <button onClick={onAdd}>Dodaj</button>
                </div>

                <table cellPadding={6} style={{ borderCollapse:'collapse', width:'100%' }}>
                    <thead><tr><th>Račun</th><th>Kategorija</th><th>Znesek</th><th>Valuta</th><th>Opis</th><th></th></tr></thead>
                    <tbody>
                    {lines.map(l=>(
                        <tr key={l.id} style={{ borderTop:'1px solid #eee' }}>
                            <td>{accounts.find(a=>a.id===l.accountId)?.name || l.accountId}</td>
                            <td>{l.categoryId ? (categories.find(c=>c.id===l.categoryId)?.name || l.categoryId) : ''}</td>
                            <td>{l.amount.toFixed(2)}</td>
                            <td>{l.currency}</td>
                            <td>{l.description || ''}</td>
                            <td style={{ textAlign:'right' }}>
                                <button onClick={()=>onDelete(l.id)}>Izbriši</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
