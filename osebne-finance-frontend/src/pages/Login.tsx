import { useState } from 'react';
import { login, register, profile } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import type {FormEvent} from "react";

export default function Login() {
    const [email, setEmail] = useState('user@example.com');
    const [password, setPassword] = useState('Passw0rd!');
    const [mode, setMode] = useState<'login'|'register'>('login');
    const [err, setErr] = useState('');
    const nav = useNavigate();

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setErr('');
        try {
            if (mode === 'register') await register(email, password);
            await login(email, password);
            await profile();
            nav('/accounts');
        } catch (e: any) {
            setErr(e.message || 'Napaka');
        }
    }

    return (
        <div style={{ maxWidth: 360, margin: '15vh auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
            <h1 style={{ marginTop: 0 }}>{mode === 'login' ? 'Prijava' : 'Registracija'}</h1>
            {err && <div style={{ color: 'crimson', marginBottom: 8 }}>{err}</div>}
            <form onSubmit={onSubmit}>
                <div style={{ display: 'grid', gap: 8 }}>
                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-pošta" />
                    <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Geslo" type="password" />
                    <button type="submit">{mode === 'login' ? 'Prijava' : 'Registracija'}</button>
                </div>
            </form>
            <div style={{ marginTop: 12 }}>
                {mode === 'login' ? (
                    <button onClick={() => setMode('register')}>Ustvari račun</button>
                ) : (
                    <button onClick={() => setMode('login')}>Že imam račun</button>
                )}
            </div>
        </div>
    );
}
