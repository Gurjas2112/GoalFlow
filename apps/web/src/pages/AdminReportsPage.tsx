import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ScoreDisplay } from '../components/Shared';

export default function AdminReportsPage() {
  const [report, setReport] = useState<any[]>([]);
  const [completion, setCompletion] = useState<any[]>([]);
  const [selectedCycle] = useState('');
  const [tab, setTab] = useState<'achievement' | 'completion'>('achievement');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [, reportRes, compRes] = await Promise.all([
          api.get('/cycles'), api.get('/reports/achievement'), api.get('/reports/completion'),
        ]);
        setReport(reportRes.data);
        setCompletion(compRes.data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const exportCSV = async () => {
    try {
      const res = await api.get('/reports/achievement/export', { responseType: 'blob', params: { cycleId: selectedCycle || undefined } });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'achievement_report.csv'; a.click();
    } catch {}
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header page-header-row">
        <div><h1 className="page-title">Reports</h1><p className="page-subtitle">Achievement reports and completion tracking</p></div>
        <button className="btn btn-primary" onClick={exportCSV}>📥 Export CSV</button>
      </div>
      <div className="tabs">
        <button className={`tab ${tab === 'achievement' ? 'active' : ''}`} onClick={() => setTab('achievement')}>Achievement Report</button>
        <button className={`tab ${tab === 'completion' ? 'active' : ''}`} onClick={() => setTab('completion')}>Completion Dashboard</button>
      </div>

      {tab === 'achievement' && (
        <div className="table-container">
          <table>
            <thead><tr><th>Employee</th><th>Goal</th><th>Thrust Area</th><th>UoM</th><th>Target</th><th>Actual</th><th>Score</th><th>Status</th></tr></thead>
            <tbody>
              {report.length === 0 ? <tr><td colSpan={8} className="text-center text-secondary">No data</td></tr> : report.map((r, i) => (
                <tr key={i}>
                  <td className="fw-600">{r.employeeName}</td><td>{r.goalTitle}</td><td>{r.thrustArea}</td><td>{r.uomType}</td>
                  <td>{r.target}</td><td>{r.actual ?? '—'}</td><td><ScoreDisplay score={r.score} /></td><td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'completion' && (
        <div className="table-container">
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Manager</th><th>Sheet Status</th><th>Goals</th><th>Achievements</th><th>Check-in</th></tr></thead>
            <tbody>
              {completion.map((c, i) => (
                <tr key={i}>
                  <td className="fw-600">{c.employeeName}</td><td>{c.department}</td><td>{c.manager}</td>
                  <td><span className={`badge badge-${c.sheetStatus.toLowerCase()}`}>{c.sheetStatus}</span></td>
                  <td>{c.goalCount}</td><td>{c.achievementCount}</td>
                  <td>{c.isCheckInComplete ? <span className="badge badge-completed">Done</span> : <span className="badge badge-not-started">Pending</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
