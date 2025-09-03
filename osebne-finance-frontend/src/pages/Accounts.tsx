import { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import {getAccounts, createAccount, updateAccount, deleteAccount, type Account} from '../lib/api';

export default function Accounts() {
    const [items, setItems] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [form, setForm] = useState({ name:'', type:'CHECKING', currency:'EUR' });

    async function load() {
        setLoading(true); setErr('');
        try { setItems(await getAccounts()); } catch(e:any){ setErr(e.message); }
        finally { setLoading(false); }
    }
    useEffect(() => { load(); }, []);

    async function onCreate() {
        if (!form.name) return;
        await createAccount(form); setForm({ name:'', type:'CHECKING', currency:'EUR' }); await load();
    }
    async function onUpdate(i: Account) {
        await updateAccount(i.id, { name: i.name, type: i.type, currency: i.currency }); await load();
    }
    async function onDelete(id: string) { await deleteAccount(id); await load(); }

    return (
        <>
            <Nav />
            <div style={{ padding:16 }}>
                <h2>Računi</h2>
                {loading && <div>Nalaganje…</div>}
                {err && <div style={{ color:'crimson' }}>{err}</div>}

                <div style={{ display:'flex', gap:8, margin:'12px 0' }}>
                    <input placeholder="Ime" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
                    <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
                        <option value="CHECKING">CHECKING</option>
                        <option value="SAVINGS">SAVINGS</option>
                        <option value="CASH">CASH</option>
                    </select>
                    <input placeholder="Valuta" value={form.currency} onChange={e=>setForm({...form, currency:e.target.value})} style={{ width:80 }} />
                    <button onClick={onCreate}>Dodaj</button>
                </div>

                <table cellPadding={6} style={{ borderCollapse:'collapse', width:'100%' }}>
                    <thead><tr><th>Ime</th><th>Tip</th><th>Valuta</th><th></th></tr></thead>
                    <tbody>
                    {items.map((a)=>(
                        <tr key={a.id} style={{ borderTop:'1px solid #eee' }}>
                            <td><input value={a.name} onChange={e=>setItems(prev=>prev.map(x=>x.id===a.id?{...x,name:e.target.value}:x))} /></td>
                            <td>
                                <select value={a.type} onChange={e=>setItems(prev=>prev.map(x=>x.id===a.id?{...x,type:e.target.value}:x))}>
                                    <option value="CHECKING">CHECKING</option>
                                    <option value="SAVINGS">SAVINGS</option>
                                    <option value="CASH">CASH</option>
                                </select>
                            </td>
                            <td><input value={a.currency} onChange={e=>setItems(prev=>prev.map(x=>x.id===a.id?{...x,currency:e.target.value}:x))} style={{ width:80 }} /></td>
                            <td style={{ textAlign:'right' }}>
                                <button onClick={()=>onUpdate(a)}>Shrani</button>
                                <button onClick={()=>onDelete(a.id)} style={{ marginLeft:8 }}>Izbriši</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
