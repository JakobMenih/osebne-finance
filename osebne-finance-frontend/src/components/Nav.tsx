import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearToken } from '../lib/api';

export default function Nav() {
    const { pathname } = useLocation();
    const nav = useNavigate();
    const A = ({to,label}:{to:string;label:string}) => <Link to={to} style={{ fontWeight: pathname.startsWith(to) ? 700 : 400 }}>{label}</Link>;
    return (
        <div style={{ display:'flex', gap:12, alignItems:'center', padding:12, borderBottom:'1px solid #eee' }}>
            <b>Finančnik</b>
            <A to="/accounts" label="Računi" />
            <A to="/categories" label="Kategorije" />
            <A to="/transactions" label="Transakcije" />
            <A to="/budgets" label="Proračuni" />
            <A to="/uploads" label="Nalaganja" />
            <A to="/audit-logs" label="Revizija" />
            <div style={{ marginLeft:'auto' }}>
                <button onClick={() => { clearToken(); nav('/login'); }}>Odjava</button>
            </div>
        </div>
    );
}
