import { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import {getCategories, createCategory, updateCategory, deleteCategory, type Category, type CategoryType} from '../lib/api';

export default function Categories() {
    const [items, setItems] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [form, setForm] = useState<{ name:string; type:CategoryType }>({ name:'', type:'expense' });

    async function load() {
        setLoading(true); setErr('');
        try { setItems(await getCategories()); } catch(e:any){ setErr(e.message); }
        finally { setLoading(false); }
    }
    useEffect(()=>{ load(); }, []);

    async function onCreate() {
        if (!form.name) return;
        await createCategory({ name: form.name, type: form.type });
        setForm({ name:'', type:'expense' }); await load();
    }
    async function onUpdate(c: Category) { await updateCategory(c.id, { name: c.name, type: c.type as CategoryType }); await load(); }
    async function onDelete(id: string) { await deleteCategory(id); await load(); }

    return (
        <>
            <Nav />
            <div style={{ padding:16 }}>
                <h2>Kategorije</h2>
                {loading && <div>Nalaganje…</div>}
                {err && <div style={{ color:'crimson' }}>{err}</div>}

                <div style={{ display:'flex', gap:8, margin:'12px 0' }}>
                    <input placeholder="Ime" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
                    <select value={form.type} onChange={e=>setForm({...form, type:e.target.value as CategoryType})}>
                        <option value="expense">expense</option>
                        <option value="income">income</option>
                    </select>
                    <button onClick={onCreate}>Dodaj</button>
                </div>

                <table cellPadding={6} style={{ borderCollapse:'collapse', width:'100%' }}>
                    <thead><tr><th>Ime</th><th>Tip</th><th></th></tr></thead>
                    <tbody>
                    {items.map(c=>(
                        <tr key={c.id} style={{ borderTop:'1px solid #eee' }}>
                            <td><input value={c.name} onChange={e=>setItems(prev=>prev.map(x=>x.id===c.id?{...x,name:e.target.value}:x))} /></td>
                            <td>
                                <select value={c.type} onChange={e=>setItems(prev=>prev.map(x=>x.id===c.id?{...x,type:e.target.value as CategoryType}:x))}>
                                    <option value="expense">expense</option>
                                    <option value="income">income</option>
                                </select>
                            </td>
                            <td style={{ textAlign:'right' }}>
                                <button onClick={()=>onUpdate(c)}>Shrani</button>
                                <button onClick={()=>onDelete(c.id)} style={{ marginLeft:8 }}>Izbriši</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
