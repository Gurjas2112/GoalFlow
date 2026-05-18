import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  name: string;
  email?: string;
}

interface Escalation {
  id: string;
  userId: string;
  reason: string;
  createdAt: string;
  user?: User;
}

interface EscalationRule {
  id: string;
  eventType: string;
  triggerAfterDays: number;
  notifyRole: string;
  isActive: boolean;
}

export default function AdminEscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [tab, setTab] = useState<'open' | 'rules'>('open');
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const [escRes, rulesRes] = await Promise.all([api.get('/escalations'), api.get('/escalations/rules')]);
      setEscalations(escRes.data);
      setRules(rulesRes.data);
    } catch (err) {
      console.error('Failed to fetch escalations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [escRes, rulesRes] = await Promise.all([api.get('/escalations'), api.get('/escalations/rules')]);
        if (isMounted) {
          setEscalations(escRes.data);
          setRules(rulesRes.data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch escalations:', err);
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const resolve = async (id: string) => {
    try {
      await api.put(`/escalations/${id}/resolve`);
      await fetch();
    } catch (err) {
      console.error('Failed to resolve escalation:', err);
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/escalations/rules/${id}`, { isActive: !isActive });
      await fetch();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Escalations</h1><p className="page-subtitle">Manage escalation rules and open escalations</p></div>
      <div className="tabs">
        <button className={`tab ${tab === 'open' ? 'active' : ''}`} onClick={() => setTab('open')}>Open ({escalations.length})</button>
        <button className={`tab ${tab === 'rules' ? 'active' : ''}`} onClick={() => setTab('rules')}>Rules ({rules.length})</button>
      </div>

      {tab === 'open' && (
        <div className="table-container">
          <table>
            <thead><tr><th>Employee</th><th>Reason</th><th>Created</th><th>Action</th></tr></thead>
            <tbody>
              {escalations.length === 0 ? <tr><td colSpan={4} className="text-center text-secondary">No open escalations</td></tr> : escalations.map((e) => (
                <tr key={e.id}>
                  <td className="fw-600">{e.user?.name}</td>
                  <td className="text-sm">{e.reason}</td>
                  <td className="text-secondary text-sm">{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td><button className="btn btn-success btn-sm" onClick={() => resolve(e.id)}>Resolve</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'rules' && (
        <div className="table-container">
          <table>
            <thead><tr><th>Event Type</th><th>Trigger After (days)</th><th>Notify Role</th><th>Active</th></tr></thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className="fw-600">{r.eventType}</td>
                  <td>{r.triggerAfterDays}</td>
                  <td><span className="badge badge-locked">{r.notifyRole}</span></td>
                  <td>
                    <label className="toggle" title="Toggle escalation rule active status">
                      <input type="checkbox" title="Toggle rule" checked={r.isActive} onChange={() => toggleRule(r.id, r.isActive)} />
                      <span className="toggle-slider" />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
