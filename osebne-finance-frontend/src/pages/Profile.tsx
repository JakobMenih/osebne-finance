import { useEffect, useState } from 'react';
import { getProfile, patch, post } from '../lib/api';

interface ProfileData {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    currency?: string;
}

export default function Profile() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [err, setErr] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await getProfile();
                setProfile(data);
            } catch (e: any) {
                setErr(e.message);
            }
        };
        loadProfile();
    }, []);

    async function onSaveProfile() {
        if (!profile) return;
        setErr('');
        setMessage('');
        try {
            await patch(`/users/${profile.id}`, {
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                currency: profile.currency || ''
            });
            setMessage('Podatki posodobljeni.');
        } catch (e: any) {
            setErr(e.message);
        }
    }

    async function onChangePassword() {
        if (!profile || !oldPassword || !newPassword) return;
        setErr('');
        setMessage('');
        try {
            await post(`/users/${profile.id}/change-password`, {
                oldPassword: oldPassword,
                newPassword: newPassword
            });
            setMessage('Geslo je bilo spremenjeno.');
            setOldPassword('');
            setNewPassword('');
        } catch (e: any) {
            setErr(e.message);
        }
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Profil</h2>
            {err && <div className="text-red-600 mb-3">{err}</div>}
            {message && <div className="text-green-600 mb-3">{message}</div>}
            {profile && (
                <div className="max-w-sm">
                    <div className="mb-3">
                        <label className="block font-medium">Email:</label>
                        <div className="pl-1">{profile.email}</div>
                    </div>
                    <div className="mb-3">
                        <label className="block font-medium">Ime:</label>
                        <input
                            value={profile.firstName || ''}
                            onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="block font-medium">Priimek:</label>
                        <input
                            value={profile.lastName || ''}
                            onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="block font-medium">Privzeta valuta:</label>
                        <input
                            value={profile.currency || ''}
                            onChange={e => setProfile({ ...profile, currency: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 w-20"
                        />
                    </div>
                    <button
                        onClick={onSaveProfile}
                        className="bg-blue-500 text-white px-4 py-1 rounded"
                    >
                        Shrani
                    </button>
                    <h3 className="text-xl font-semibold mt-6 mb-2">Spremeni geslo</h3>
                    <div className="mb-3">
                        <label className="block font-medium">Trenutno geslo:</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={e => setOldPassword(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="block font-medium">Novo geslo:</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                        />
                    </div>
                    <button
                        onClick={onChangePassword}
                        className="bg-blue-500 text-white px-4 py-1 rounded"
                    >
                        Spremeni geslo
                    </button>
                </div>
            )}
        </div>
    );
}
