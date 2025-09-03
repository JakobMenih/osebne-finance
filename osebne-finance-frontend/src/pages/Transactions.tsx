import { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import {getTransactions, createTransaction, deleteTransaction, type Transaction} from '../lib/api';
import { Link } from 'react-router-dom';

export default function Transactions() {
    const [items, setItems] = useState<Transaction[]>([]);
    const [err, setErr] = useState('');
    const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
    const [description, setDescription] = useState('');

    async function load() { try { setItems(await getTransactions()); } catch(e:any){ setErr(e.message); } }
    useEffect(()=>{ load(); }, []);

    async function onCreate() {
        await createTransaction({ date, description: description || null });
        setDescription(''); await load();
    }
    async function onDelete(id: string) { await deleteTransaction(id); await load(); }

    return (
        <>
            <Nav />
            <div style={{ padding:16 }}>
                <h2>Transakcije</h2>
                {err && <div style={{ color:'crimson' }}>{err}</div>}

                <div style={{ display:'flex', gap:8, margin:'12px 0' }}>
                    <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
                    <input placeholder="Opis" value={description} onChange={e=>setDescription(e.target.value)} />
                    <button onClick={onCreate}>Dodaj</button>
                </div>

                <table cellPadding={6} style={{ borderCollapse:'collapse', width:'100%' }}>
                    <thead><tr><th>Datum</th><th>Opis</th><th></th></tr></thead>
                    <tbody>
                    {items.map(t=>(
                        <tr key={t.id} style={{ borderTop:'1px solid #eee' }}>
                            <td>{t.date?.slice(0,10)}</td>
                            <td>{t.description || ''}</td>
                            <td style={{ textAlign:'right' }}>
                                <Link to={`/transactions/${t.id}`}><button>Postavke</button></Link>
                                <button onClick={()=>onDelete(t.id)} style={{ marginLeft:8 }}>Izbriši</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
