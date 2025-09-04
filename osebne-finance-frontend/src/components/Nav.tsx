import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { post } from '../lib/api';

export default function Nav() {
    const nav = useNavigate();
    const [msg, setMsg] = useState('');

    async function refreshFx() {
        try {
            await post('/fx', { base: 'EUR', quote: 'USD', rate: 1, rateDate: new Date().toISOString().slice(0,10), source: 'manual' });
            setMsg('Tečaji osveženi (primer POST).');
        } catch (e:any) { setMsg(e.message); }
    }

    function logout() { localStorage.removeItem('token'); nav('/login', {replace:true}); }

    return (
        <div style={{ display:'flex', gap:12, padding:12, borderBottom:'1px solid #333' }}>
            <Link to="/accounts">Računi</Link>
            <Link to="/categories">Kategorije</Link>
            <Link to="/transactions">Transakcije</Link>
            <Link to="/budgets">Proračuni</Link>
            <Link to="/uploads">Datoteke</Link>
            <Link to="/audit-logs">Logi</Link>
            <span style={{ marginLeft:'auto' }}>
        <button onClick={refreshFx}>Osveži tečaje</button>
        <button onClick={logout} style={{ marginLeft:8 }}>Odjava</button>
      </span>
            {msg && <span style={{ color:'#8f8', marginLeft:8 }}>{msg}</span>}
        </div>
    );
}
