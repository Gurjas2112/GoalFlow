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

// Event types the backend escalation job (apps/api/src/jobs/escalationTrigger.ts) knows how to evaluate.
const EVENT_TYPES: { value: string; label: string; description: string }[] = [
  {
    value: 'GOAL_NOT_SUBMITTED',
    label: 'Goal not submitted',
    description: 'Employee has a DRAFT goal sheet older than N days.',
  },
  {
    value: 'GOAL_NOT_APPROVED',
    label: 'Goal not approved',
    description: 'Manager has not approved a SUBMITTED sheet within N days.',
  },
  {
    value: 'CHECKIN_NOT_DONE',
    label: 'Check-in not done',
    description: 'Locked sheet has no check-in N days after the active cycle opened.',
  },
];

export default function AdminEscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [tab, setTab] = useState<'open' | 'rules'>('open');
  const [loading, setLoading] = useState(true);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    eventType: EVENT_TYPES[0].value,
    triggerAfterDays: 7,
    notifyRole: 'MANAGER',
    isActive: true,
  });
  const [ruleError, setRuleError] = useState('');
  const [savingRule, setSavingRule] = useState(false);

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

  const handleCreateRule = async () => {
    setRuleError('');
    if (!ruleForm.eventType) { setRuleError('Event type is required'); return; }
    if (!ruleForm.triggerAfterDays || ruleForm.triggerAfterDays < 1) {
      setRuleError('Trigger days must be at least 1');
      return;
    }
    setSavingRule(true);
    try {
      await api.post('/escalations/rules', ruleForm);
      setShowRuleForm(false);
      setRuleForm({ eventType: EVENT_TYPES[0].value, triggerAfterDays: 7, notifyRole: 'MANAGER', isActive: true });
      await fetch();
    } catch (err: any) {
      setRuleError(err?.response?.data?.error || 'Failed to create rule');
    } finally {
      setSavingRule(false);
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
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn btn-primary" onClick={() => { setShowRuleForm(true); setRuleError(''); }}>+ Add Rule</button>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Event Type</th><th>Trigger After (days)</th><th>Notify Role</th><th>Active</th></tr></thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-secondary">No escalation rules configured. Click “+ Add Rule” to create one.</td></tr>
                ) : rules.map((r) => {
                  const meta = EVENT_TYPES.find(e => e.value === r.eventType);
                  return (
                    <tr key={r.id}>
                      <td className="fw-600" title={meta?.description || ''}>{meta?.label || r.eventType}</td>
                      <td>{r.triggerAfterDays}</td>
                      <td><span className="badge badge-locked">{r.notifyRole}</span></td>
                      <td>
                        <label className="toggle" title="Toggle escalation rule active status">
                          <input type="checkbox" title="Toggle rule" checked={r.isActive} onChange={() => toggleRule(r.id, r.isActive)} />
                          <span className="toggle-slider" />
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showRuleForm && (
        <div className="modal-overlay" onClick={() => setShowRuleForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Escalation Rule</h3>
              <button className="modal-close" onClick={() => setShowRuleForm(false)}>✕</button>
            </div>

            {ruleError && <div className="login-error">{ruleError}</div>}

            <div className="alert-info" style={{ fontSize: '0.85rem', marginBottom: 12 }}>
              ℹ️ The escalation job runs hourly and creates an escalation record whenever the chosen condition has been true for the configured number of days.
            </div>

            <div className="form-group">
              <label className="form-label">Event Type</label>
              <select
                className="form-select"
                title="Choose the condition that triggers this escalation"
                value={ruleForm.eventType}
                onChange={(e) => setRuleForm({ ...ruleForm, eventType: e.target.value })}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <p className="text-secondary" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                {EVENT_TYPES.find(t => t.value === ruleForm.eventType)?.description}
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Trigger After (days)</label>
                <input
                  type="number"
                  className="form-input"
                  title="Number of days the condition must persist before the rule fires"
                  placeholder="e.g. 7"
                  min={1}
                  value={ruleForm.triggerAfterDays}
                  onChange={(e) => setRuleForm({ ...ruleForm, triggerAfterDays: parseInt(e.target.value || '0', 10) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notify Role</label>
                <select
                  className="form-select"
                  title="Role notified when the rule fires"
                  value={ruleForm.notifyRole}
                  onChange={(e) => setRuleForm({ ...ruleForm, notifyRole: e.target.value })}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin / HR</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={ruleForm.isActive}
                  onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                />
                Active
              </label>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowRuleForm(false)} disabled={savingRule}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateRule} disabled={savingRule}>
                {savingRule ? 'Saving…' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
