import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function AdminCyclesPage() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ phase: 'GOAL_SETTING', year: '2025', openDate: '', closeDate: '' });

  const fetchCycles = async () => { try { const r = await api.get('/cycles'); setCycles(r.data); } catch {} setLoading(false); };
  useEffect(() => { fetchCycles(); }, []);

  const create = async () => { try { await api.post('/cycles', form); setShowForm(false); fetchCycles(); } catch {} };

  const toggleOverride = async (id: string) => { try { await api.post(`/cycles/${id}/override`); fetchCycles(); } catch {} };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header page-header-row">
        <div><h1 className="page-title">Cycle Management</h1><p className="page-subtitle">Configure goal-setting and check-in windows</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create Cycle</button>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>Phase</th><th>Year</th><th>Opens</th><th>Closes</th><th>Override</th><th>Actions</th></tr></thead>
          <tbody>
            {cycles.map((c) => (
              <tr key={c.id} style={c.isOverride ? { background: 'rgba(59,130,246,0.05)' } : {}}>
                <td className="fw-600">{c.phase.replace('_', ' ')}</td>
                <td>{c.year}</td>
                <td className="text-secondary">{new Date(c.openDate).toLocaleDateString()}</td>
                <td className="text-secondary">{new Date(c.closeDate).toLocaleDateString()}</td>
                <td>{c.isOverride ? <span className="badge badge-submitted">Active</span> : <span className="text-secondary">—</span>}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => toggleOverride(c.id)}>{c.isOverride ? 'Remove Override' : 'Force Open'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Create Cycle</h3><button className="modal-close" onClick={() => setShowForm(false)}>✕</button></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Phase</label>
                <select className="form-select" value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })}>
                  {['GOAL_SETTING', 'Q1', 'Q2', 'Q3', 'Q4'].map((p) => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Year</label><input className="form-input" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Open Date</label><input className="form-input" type="date" value={form.openDate} onChange={(e) => setForm({ ...form, openDate: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Close Date</label><input className="form-input" type="date" value={form.closeDate} onChange={(e) => setForm({ ...form, closeDate: e.target.value })} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={create}>Create</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
