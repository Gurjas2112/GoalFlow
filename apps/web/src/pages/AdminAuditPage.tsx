import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const r = await api.get('/audit'); setLogs(r.data); } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Audit Log</h1><p className="page-subtitle">Track all changes made to goals after lock</p></div>
      <div className="table-container">
        <table>
          <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Field</th><th>Old Value</th><th>New Value</th></tr></thead>
          <tbody>
            {logs.length === 0 ? <tr><td colSpan={6} className="text-center text-secondary">No audit entries</td></tr> : logs.map((l) => (
              <tr key={l.id}>
                <td className="text-secondary text-sm">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="fw-600">{l.user?.name}</td>
                <td>{l.action}</td>
                <td className="text-secondary">{l.fieldName || '—'}</td>
                <td className="text-secondary">{l.oldValue || '—'}</td>
                <td>{l.newValue || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
