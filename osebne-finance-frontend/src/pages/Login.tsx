import { useState } from 'react';
import { post } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const nav = useNavigate();
    const [email, setEmail] = useState('user@example.com');
    const [password, setPassword] = useState('Passw0rd!');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    async function doLogin() {
        setErr(null); setLoading(true);
        try {
            const r = await post('/auth/login', { email, password });
            localStorage.setItem('token', r.access_token);
            nav('/accounts', { replace: true });
        } catch (e: any) {
            setErr(e?.message || 'Napaka pri prijavi');
        } finally { setLoading(false); }
    }

    async function doRegister() {
        setErr(null); setLoading(true);
        try {
            await post('/auth/register', { email, password }); // 201
            await doLogin(); // auto-login -> redirect
        } catch (e: any) {
            setErr(e?.message || 'Napaka pri registraciji');
            setLoading(false);
        }
    }

    return (
        <div className="login-card">
            {err && <div className="text-red-500 mb-2">{err}</div>}
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="geslo" />
            <button disabled={loading} onClick={doLogin}>Prijava</button>
            <button disabled={loading} onClick={doRegister}>Ustvari račun</button>
        </div>
    );
}
