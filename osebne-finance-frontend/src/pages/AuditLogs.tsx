import { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { type AuditLog, getAuditLogs } from '../lib/api';

export default function AuditLogs() {
    const [items, setItems] = useState<AuditLog[]>([]);
    const [err, setErr] = useState('');

    useEffect(() => {
        getAuditLogs()
            .then(setItems)
            .catch(e => setErr(e.message));
    }, []);

    return (
        <>
            <Nav />
            <div style={{ padding: 16 }}>
                <h2>Revizijski zapisi</h2>
                {err && <div style={{ color: 'crimson' }}>{err}</div>}
                <table cellPadding={6} style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                    <tr>
                        <th>Čas</th>
                        <th>Akcija</th>
                        <th>Entiteta</th>
                        <th>Podatki</th>
                    </tr>
                    </thead>
                    <tbody>
                    {items.map(log => (
                        <tr key={log.id} style={{ borderTop: '1px solid #eee' }}>
                            <td>{new Date(log.ts).toLocaleString()}</td>
                            <td>{log.action || ''}</td>
                            <td>{log.tableName || ''}</td>
                            <td>
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                        {JSON.stringify(log.newData ?? log.oldData ?? {}, null, 2)}
                                    </pre>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
