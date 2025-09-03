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
    const [form, setForm] = useState<{categoryId:string; periodStart:string; periodEnd:string; amount:number}>({
        categoryId:'', periodStart: new Date().toISOString().slice(0,10), periodEnd: new Date().toISOString().slice(0,10), amount: 0
    });

    async function load() {
        try { const [b, c] = await Promise.all([getBudgets(), getCategories()]); setItems(b); setCats(c); if (!form.categoryId && c[0]) setForm(s=>({...s, categoryId:c[0].id})); }
        catch(e:any){ setErr(e.message); }
    }
    useEffect(()=>{ load(); }, []);

    async function onCreate() { await createBudget(form); setForm(s=>({...s, amount:0})); await load(); }
    async function onUpdate(b: Budget) { await updateBudget(b.id, { amount: b.amount }); await load(); }
    async function onDelete(id: string) { await deleteBudget(id); await load(); }

    return (
        <>
            <Nav />
            <div style={{ padding:16 }}>
                <h2>Proračuni</h2>
                {err && <div style={{ color:'crimson' }}>{err}</div>}

                <div style={{ display:'flex', gap:8, margin:'12px 0' }}>
                    <select value={form.categoryId} onChange={e=>setForm({...form, categoryId:e.target.value})}>
                        {cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="date" value={form.periodStart} onChange={e=>setForm({...form, periodStart:e.target.value})} />
                    <input type="date" value={form.periodEnd} onChange={e=>setForm({...form, periodEnd:e.target.value})} />
                    <input type="number" step="0.01" value={form.amount} onChange={e=>setForm({...form, amount:Number(e.target.value)})} style={{ width:120 }} />
                    <button onClick={onCreate}>Dodaj</button>
                </div>

                <table cellPadding={6} style={{ borderCollapse:'collapse', width:'100%' }}>
                    <thead><tr><th>Kategorija</th><th>Od</th><th>Do</th><th>Znesek</th><th></th></tr></thead>
                    <tbody>
                    {items.map(b=>(
                        <tr key={b.id} style={{ borderTop:'1px solid #eee' }}>
                            <td>{cats.find(c=>c.id===b.categoryId)?.name || b.categoryId}</td>
                            <td>{b.periodStart?.slice(0,10)}</td>
                            <td>{b.periodEnd?.slice(0,10)}</td>
                            <td><input type="number" step="0.01" value={b.amount} onChange={e=>setItems(prev=>prev.map(x=>x.id===b.id?{...x, amount:Number(e.target.value)}:x))} style={{ width:120 }} /></td>
                            <td style={{ textAlign:'right' }}>
                                <button onClick={()=>onUpdate(b)}>Shrani</button>
                                <button onClick={()=>onDelete(b.id)} style={{ marginLeft:8 }}>Izbriši</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
