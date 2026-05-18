import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { GoalStatusBadge, WeightageMeter, UoMBadge, CycleWindowBanner, ConfirmModal } from '../components/Shared';

const THRUST_AREAS = ['Revenue', 'Efficiency', 'Quality', 'Delivery', 'Safety', 'Innovation', 'Customer Satisfaction', 'People Development'];
const UOM_TYPES = [
  { value: 'NUMERIC_MIN', label: 'Numeric (Higher is Better)' },
  { value: 'NUMERIC_MAX', label: 'Numeric (Lower is Better)' },
  { value: 'TIMELINE', label: 'Timeline (Date-based)' },
  { value: 'ZERO', label: 'Zero-based (0 = Success)' },
];

interface Goal {
  id: string;
  thrustArea: string;
  title: string;
  description: string;
  uomType: string;
  target: number;
  deadline?: string | null;
  weightage: number;
  isShared?: boolean;
  isPrimaryOwner?: boolean;
}

interface GoalSheet {
  id: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'LOCKED' | 'RETURNED';
  goals?: Goal[];
}

interface Cycle {
  id: string;
  phase: string;
  year: number;
  openDate: string;
  closeDate: string;
}

interface ApiError {
  response?: { data?: { error?: string } };
}

export default function EmployeeGoalsPage() {
  const [sheet, setSheet] = useState<GoalSheet | null>(null);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [error, setError] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const [form, setForm] = useState({ thrustArea: '', title: '', description: '', uomType: 'NUMERIC_MIN', target: '', deadline: '', weightage: '' });

  const fetchData = async () => {
    try {
      const res = await api.get('/goal-sheets/my');
      setSheet(res.data.sheet);
      setCycle(res.data.cycle);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const createSheet = async () => {
    if (!cycle) return;
    try {
      const res = await api.post('/goal-sheets', { cycleId: cycle.id });
      setSheet(res.data);
    } catch (err) {
      setError((err as ApiError).response?.data?.error || 'Failed to create sheet');
    }
  };

  const totalWeightage = sheet?.goals?.reduce((s: number, g: Goal) => s + g.weightage, 0) || 0;
  const isEditable = sheet?.status === 'DRAFT' || sheet?.status === 'RETURNED';
  const canSubmit = !!isEditable && totalWeightage === 100 && !!sheet?.goals?.length && sheet.goals.length <= 8;

  const resetForm = () => { setForm({ thrustArea: '', title: '', description: '', uomType: 'NUMERIC_MIN', target: '', deadline: '', weightage: '' }); setEditing(null); setShowForm(false); };

  const handleSave = async () => {
    setError('');
    try {
      if (editing) {
        await api.put(`/goals/${editing.id}`, form);
      } else if (sheet) {
        await api.post('/goals', { ...form, goalSheetId: sheet.id });
      }
      resetForm();
      fetchData();
    } catch (err) {
      setError((err as ApiError).response?.data?.error || 'Failed to save goal');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/goals/${id}`);
      fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleSubmit = async () => {
    setConfirmSubmit(false);
    if (!sheet) return;
    try {
      await api.post(`/goal-sheets/${sheet.id}/submit`);
      fetchData();
    } catch (err) {
      setError((err as ApiError).response?.data?.error || 'Submit failed');
    }
  };

  const editGoal = (goal: Goal) => {
    setForm({
      thrustArea: goal.thrustArea, title: goal.title, description: goal.description,
      uomType: goal.uomType, target: String(goal.target), deadline: goal.deadline ? goal.deadline.split('T')[0] : '', weightage: String(goal.weightage),
    });
    setEditing(goal);
    setShowForm(true);
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header page-header-row">
        <div><h1 className="page-title">My Goals</h1><p className="page-subtitle">Create and manage your goal sheet</p></div>
        <div className="page-actions">
          {!sheet && cycle && <button className="btn btn-primary" onClick={createSheet}>Start Goal Sheet</button>}
          {isEditable && (sheet?.goals?.length ?? 0) < 8 && <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>+ Add Goal</button>}
          {canSubmit && <button className="btn btn-success" onClick={() => setConfirmSubmit(true)}>Submit for Approval</button>}
        </div>
      </div>

      <CycleWindowBanner cycle={cycle} />
      {error && <div className="login-error">{error}</div>}
      {!cycle && <div className="empty-state"><h3>No active cycle</h3><p>Wait for admin to open a goal setting cycle.</p></div>}

      {sheet && (
        <>
          <div className="goals-status-row">
            <GoalStatusBadge status={sheet.status} />
            <span className="text-secondary text-sm">{sheet.goals?.length || 0} goals</span>
          </div>
          <WeightageMeter current={totalWeightage} />

          {sheet.goals?.length === 0 && <div className="empty-state"><h3>No goals yet</h3><p>Add your first goal to get started.</p></div>}

          <div className="goals-list">
            {sheet.goals?.map((goal: Goal) => (
              <div key={goal.id} className="card goal-card">
                <div className="goal-card-body">
                  <div className="goal-card-head">
                    <span className="fw-600">{goal.title}</span>
                    <UoMBadge type={goal.uomType} />
                    {goal.isShared && <span className="badge badge-submitted">Shared</span>}
                  </div>
                  <p className="text-secondary text-sm">{goal.description}</p>
                  <div className="flex gap-2 mt-1 text-sm">
                    <span>Thrust: <strong>{goal.thrustArea}</strong></span>
                    <span>Target: <strong>{goal.uomType === 'TIMELINE' ? (goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '—') : goal.target}</strong></span>
                    <span>Weight: <strong>{goal.weightage}%</strong></span>
                  </div>
                </div>
                {isEditable && !(goal.isShared && !goal.isPrimaryOwner) && (
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-sm" onClick={() => editGoal(goal)}>Edit</button>
                    <button className="btn btn-ghost btn-sm btn-danger-ghost" onClick={() => handleDelete(goal.id)}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-goal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Edit Goal' : 'Add Goal'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="goal-thrust">Thrust Area</label>
                <select id="goal-thrust" aria-label="Thrust Area" className="form-select" value={form.thrustArea} onChange={(e) => setForm({ ...form, thrustArea: e.target.value })}>
                  <option value="">Select...</option>
                  {THRUST_AREAS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="goal-uom">UoM Type</label>
                <select id="goal-uom" aria-label="UoM Type" className="form-select" value={form.uomType} onChange={(e) => setForm({ ...form, uomType: e.target.value })}>
                  {UOM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="goal-title">Goal Title</label>
              <input id="goal-title" className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Increase quarterly revenue" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="goal-desc">Description</label>
              <textarea id="goal-desc" className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the goal..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="goal-target">{form.uomType === 'TIMELINE' ? 'Deadline' : 'Target'}</label>
                {form.uomType === 'TIMELINE' ? (
                  <input id="goal-target" aria-label="Deadline" className="form-input" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                ) : (
                  <input id="goal-target" className="form-input" type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="e.g. 1000000" />
                )}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="goal-weight">Weightage (%)</label>
                <input id="goal-weight" className="form-input" type="number" min="10" max="100" value={form.weightage} onChange={(e) => setForm({ ...form, weightage: e.target.value })} placeholder="Min 10%" />
                {parseInt(form.weightage) > 0 && parseInt(form.weightage) < 10 && <div className="form-error">Minimum 10% per goal</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.thrustArea || !form.title || !form.weightage}>Save Goal</button>
            </div>
          </div>
        </div>
      )}

      {confirmSubmit && (
        <ConfirmModal
          title="Submit Goal Sheet"
          message="Once submitted, your goals will be sent to your manager for approval. You won't be able to edit until they are returned."
          onConfirm={handleSubmit}
          onCancel={() => setConfirmSubmit(false)}
          confirmText="Submit"
        />
      )}
    </div>
  );
}
