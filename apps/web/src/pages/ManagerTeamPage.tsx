import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { GoalStatusBadge, CycleWindowBanner } from '../components/Shared';

export default function ManagerTeamPage() {
  const [sheets, setSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const cycleRes = await api.get('/cycles/active');
        setCycle(cycleRes.data);
        const res = await api.get('/goal-sheets/team');
        setSheets(res.data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Team Goals</h1>
        <p className="page-subtitle">Review and manage your team's goal sheets</p>
      </div>
      <CycleWindowBanner cycle={cycle} />

      {sheets.length === 0 ? (
        <div className="empty-state"><h3>No team sheets found</h3><p>Your team members haven't created goal sheets yet.</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Employee</th><th>Department</th><th>Status</th><th>Goals</th><th>Weightage</th><th>Updated</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {sheets.map((s: any) => {
                const total = s.goals?.reduce((sum: number, g: any) => sum + g.weightage, 0) || 0;
                return (
                  <tr key={s.id}>
                    <td className="fw-600">{s.user?.name}</td>
                    <td className="text-secondary">{s.user?.department?.name || '—'}</td>
                    <td><GoalStatusBadge status={s.status} /></td>
                    <td>{s.goals?.length || 0}</td>
                    <td style={{ color: total === 100 ? 'var(--color-success)' : 'var(--color-warning)' }}>{total}%</td>
                    <td className="text-secondary text-sm">{new Date(s.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/manager/sheet/${s.id}`)}>Review</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
