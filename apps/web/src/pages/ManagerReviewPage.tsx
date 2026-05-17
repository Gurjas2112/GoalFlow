import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { GoalStatusBadge, WeightageMeter, UoMBadge, ScoreDisplay, ConfirmModal } from '../components/Shared';

export default function ManagerReviewPage() {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReturn, setShowReturn] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showApprove, setShowApprove] = useState(false);
  const [comment, setComment] = useState('');
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  const fetchSheet = async () => {
    try {
      const res = await api.get(`/goal-sheets/${sheetId}`);
      setSheet(res.data);
    } catch { setError('Failed to load sheet'); }
    setLoading(false);
  };

  useEffect(() => { fetchSheet(); }, [sheetId]);

  const totalWeightage = sheet?.goals?.reduce((s: number, g: any) => s + (editingGoal === g.id ? (editValues.weightage ?? g.weightage) : g.weightage), 0) || 0;

  const handleApprove = async () => {
    setShowApprove(false);
    try {
      await api.post(`/goal-sheets/${sheetId}/approve`);
      fetchSheet();
    } catch (err: any) { setError(err.response?.data?.error || 'Approve failed'); }
  };

  const handleReturn = async () => {
    if (!returnReason.trim()) return;
    setShowReturn(false);
    try {
      await api.post(`/goal-sheets/${sheetId}/return`, { reason: returnReason });
      setReturnReason('');
      fetchSheet();
    } catch (err: any) { setError(err.response?.data?.error || 'Return failed'); }
  };

  const startEdit = (goal: any) => {
    setEditingGoal(goal.id);
    setEditValues({ target: goal.target, weightage: goal.weightage });
  };

  const saveEdit = async (goalId: string) => {
    try {
      await api.put(`/goals/${goalId}`, editValues);
      setEditingGoal(null);
      fetchSheet();
    } catch (err: any) { setError(err.response?.data?.error || 'Update failed'); }
  };

  const saveCheckIn = async () => {
    if (!comment.trim()) return;
    try {
      await api.post('/check-ins', { goalSheetId: sheetId, comment });
      setComment('');
      fetchSheet();
    } catch {}
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!sheet) return <div className="empty-state"><h3>Sheet not found</h3></div>;

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>← Back</button>
          <h1 className="page-title">{sheet.user?.name}'s Goals</h1>
          <p className="page-subtitle">{sheet.user?.department?.name} · {sheet.cycle?.phase} {sheet.cycle?.year}</p>
        </div>
        <div className="page-actions">
          <GoalStatusBadge status={sheet.status} />
          {sheet.status === 'SUBMITTED' && (
            <>
              <button className="btn btn-danger btn-sm" onClick={() => setShowReturn(true)}>Return</button>
              <button className="btn btn-success" onClick={() => setShowApprove(true)} disabled={totalWeightage !== 100}>Approve & Lock</button>
            </>
          )}
        </div>
      </div>

      {error && <div className="login-error">{error}</div>}
      <WeightageMeter current={totalWeightage} />

      <div className="table-container" style={{ marginTop: 16 }}>
        <table>
          <thead><tr><th>Goal</th><th>Thrust Area</th><th>UoM</th><th>Target</th><th>Weight</th><th>Actual</th><th>Score</th><th>Actions</th></tr></thead>
          <tbody>
            {sheet.goals?.map((goal: any) => {
              const ach = goal.achievements?.[0];
              const isEditing = editingGoal === goal.id;
              return (
                <tr key={goal.id}>
                  <td>
                    <div className="fw-600">{goal.title}</div>
                    <div className="text-secondary text-sm">{goal.description?.slice(0, 60)}</div>
                  </td>
                  <td>{goal.thrustArea}</td>
                  <td><UoMBadge type={goal.uomType} /></td>
                  <td>
                    {isEditing ? (
                      <input className="form-input" type="number" value={editValues.target} onChange={(e) => setEditValues({ ...editValues, target: e.target.value })} style={{ width: 90 }} />
                    ) : (
                      goal.uomType === 'TIMELINE' ? (goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '—') : goal.target
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input className="form-input" type="number" value={editValues.weightage} onChange={(e) => setEditValues({ ...editValues, weightage: e.target.value })} style={{ width: 60 }} />
                    ) : (
                      <span>{goal.weightage}%</span>
                    )}
                  </td>
                  <td>{ach?.actual ?? '—'}</td>
                  <td><ScoreDisplay score={ach?.score} /></td>
                  <td>
                    {sheet.status === 'SUBMITTED' && (
                      isEditing ? (
                        <div className="flex gap-1">
                          <button className="btn btn-primary btn-sm" onClick={() => saveEdit(goal.id)}>Save</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingGoal(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(goal)}>Edit</button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Check-in comments section */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 className="card-title" style={{ marginBottom: 12 }}>Check-in Comments</h3>
        {sheet.checkIns?.map((ci: any) => (
          <div key={ci.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex gap-1" style={{ alignItems: 'center' }}>
              <span className="fw-600 text-sm">{ci.manager?.name}</span>
              <span className="text-secondary text-sm">{new Date(ci.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm" style={{ marginTop: 4 }}>{ci.comment}</p>
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <textarea className="form-textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a check-in comment..." />
          <button className="btn btn-primary btn-sm mt-1" onClick={saveCheckIn} disabled={!comment.trim()}>Post Comment</button>
        </div>
      </div>

      {showReturn && (
        <div className="modal-overlay" onClick={() => setShowReturn(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Return for Rework</h3><button className="modal-close" onClick={() => setShowReturn(false)}>✕</button></div>
            <div className="form-group">
              <label className="form-label">Reason (required)</label>
              <textarea className="form-textarea" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Explain what needs to change..." />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowReturn(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReturn} disabled={!returnReason.trim()}>Return Sheet</button>
            </div>
          </div>
        </div>
      )}

      {showApprove && (
        <ConfirmModal title="Approve & Lock Goals" message="This will lock all goals. The employee won't be able to edit them without admin intervention." onConfirm={handleApprove} onCancel={() => setShowApprove(false)} confirmText="Approve & Lock" />
      )}
    </div>
  );
}
