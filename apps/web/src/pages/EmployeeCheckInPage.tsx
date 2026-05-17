import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { CycleWindowBanner, ScoreDisplay, UoMBadge } from '../components/Shared';

export default function EmployeeCheckInPage() {
  const [sheet, setSheet] = useState<any>(null);
  const [cycle, setCycle] = useState<any>(null);
  const [achievements, setAchievements] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/goal-sheets/my');
        setSheet(res.data.sheet);
        setCycle(res.data.cycle);
        if (res.data.sheet) {
          const achRes = await api.get(`/achievements/sheet/${res.data.sheet.id}`);
          const map: Record<string, any> = {};
          achRes.data.forEach((a: any) => { map[a.goalId] = a; });
          setAchievements(map);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const updateAchievement = (goalId: string, field: string, value: any) => {
    setAchievements((prev) => ({
      ...prev,
      [goalId]: { ...prev[goalId], goalId, [field]: value },
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    setMsg('');
    try {
      for (const goal of sheet.goals) {
        const ach = achievements[goal.id];
        if (ach) {
          await api.put(`/achievements/${goal.id}`, {
            actual: ach.actual,
            actualDate: ach.actualDate,
            status: ach.status || 'NOT_STARTED',
          });
        }
      }
      setMsg('Achievements saved successfully!');
      // Refresh scores
      const achRes = await api.get(`/achievements/sheet/${sheet.id}`);
      const map: Record<string, any> = {};
      achRes.data.forEach((a: any) => { map[a.goalId] = a; });
      setAchievements(map);
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Failed to save');
    }
    setSaving(false);
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  if (!sheet || sheet.status !== 'LOCKED') {
    return (
      <div>
        <h1 className="page-title">Quarterly Check-in</h1>
        <div className="empty-state"><h3>No locked goals</h3><p>Your goals must be approved and locked before you can log achievements.</p></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header page-header-row">
        <div><h1 className="page-title">Quarterly Check-in</h1><p className="page-subtitle">Log your achievements against planned targets</p></div>
        <button className="btn btn-primary" onClick={saveAll} disabled={saving}>{saving ? 'Saving...' : 'Save All'}</button>
      </div>
      <CycleWindowBanner cycle={cycle} />
      {msg && <div className={msg.includes('success') ? 'cycle-banner' : 'login-error'} style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Goal</th><th>UoM</th><th>Target</th><th>Actual</th><th>Status</th><th>Score</th>
            </tr>
          </thead>
          <tbody>
            {sheet.goals.map((goal: any) => {
              const ach = achievements[goal.id] || {};
              const isSharedNonPrimary = goal.isShared && !goal.isPrimaryOwner;
              return (
                <tr key={goal.id}>
                  <td>
                    <div className="fw-600">{goal.title}</div>
                    <div className="text-secondary text-sm">{goal.thrustArea} · {goal.weightage}%</div>
                  </td>
                  <td><UoMBadge type={goal.uomType} /></td>
                  <td>{goal.uomType === 'TIMELINE' ? (goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '—') : goal.target}</td>
                  <td>
                    {isSharedNonPrimary ? (
                      <span className="text-secondary text-sm">Synced from owner</span>
                    ) : goal.uomType === 'TIMELINE' ? (
                      <input className="form-input" type="date" value={ach.actualDate?.split('T')[0] || ''} onChange={(e) => updateAchievement(goal.id, 'actualDate', e.target.value)} style={{ width: 150 }} />
                    ) : (
                      <input className="form-input" type="number" value={ach.actual ?? ''} onChange={(e) => updateAchievement(goal.id, 'actual', e.target.value)} placeholder="Enter actual" style={{ width: 120 }} />
                    )}
                  </td>
                  <td>
                    <select className="form-select" value={ach.status || 'NOT_STARTED'} onChange={(e) => updateAchievement(goal.id, 'status', e.target.value)} style={{ width: 130 }} disabled={isSharedNonPrimary}>
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="ON_TRACK">On Track</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </td>
                  <td><ScoreDisplay score={ach.score} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
