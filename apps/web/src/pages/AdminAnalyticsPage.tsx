import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function AdminAnalyticsPage() {
  const [qoq, setQoq] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [distrib, setDistrib] = useState<any>(null);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/qoq'), api.get('/analytics/heatmap'),
      api.get('/analytics/goal-distribution'), api.get('/analytics/manager-effectiveness'),
    ]).then(([q, h, d, m]) => {
      setQoq(q.data); setHeatmap(h.data); setDistrib(d.data); setManagers(m.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Analytics</h1><p className="page-subtitle">Trends, distributions, and manager effectiveness</p></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 className="card-title">QoQ Achievement Trend</h3>
          {qoq.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={qoq}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} /><YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#94a3b8' }} /><Tooltip /><Line type="monotone" dataKey="avgScore" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} /></LineChart>
            </ResponsiveContainer>
          ) : <p className="text-secondary text-sm">No data yet</p>}
        </div>

        <div className="card">
          <h3 className="card-title">Completion by Department</h3>
          {heatmap.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={heatmap}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /><XAxis dataKey="department" tick={{ fontSize: 11, fill: '#94a3b8' }} /><YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#94a3b8' }} /><Tooltip /><Bar dataKey="completionRate" radius={[4, 4, 0, 0]}>{heatmap.map((e, i) => <Cell key={i} fill={e.completionRate >= 80 ? '#10b981' : e.completionRate >= 50 ? '#f59e0b' : '#ef4444'} />)}</Bar></BarChart>
            </ResponsiveContainer>
          ) : <p className="text-secondary text-sm">No data yet</p>}
        </div>
      </div>

      {distrib && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 className="card-title" style={{ marginBottom: 8 }}>Goal Distribution</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[{ title: 'By Thrust Area', data: distrib.byThrustArea }, { title: 'By UoM Type', data: distrib.byUoM }, { title: 'By Status', data: distrib.byStatus }].map(({ title, data }) => (
              <div key={title} style={{ textAlign: 'center' }}>
                <p className="text-secondary text-sm">{title}</p>
                {data?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart><Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>{data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} /></PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-secondary text-sm">No data</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {managers.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 className="card-title" style={{ marginBottom: 8 }}>Manager Effectiveness</h3>
          <div className="table-container">
            <table>
              <thead><tr><th>Manager</th><th>Team Size</th><th>Check-ins</th><th>Rate</th><th>Approved</th></tr></thead>
              <tbody>
                {managers.map((m: any) => (
                  <tr key={m.managerId} style={m.checkInRate < 50 ? { background: 'var(--color-warning-bg)' } : {}}>
                    <td className="fw-600">{m.managerName}</td><td>{m.teamSize}</td><td>{m.checkInsCompleted}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ flex: 1, height: 6, background: 'var(--color-bg-input)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${m.checkInRate}%`, height: '100%', borderRadius: 3, background: m.checkInRate >= 80 ? '#10b981' : m.checkInRate >= 50 ? '#f59e0b' : '#ef4444' }} /></div><span className="text-sm">{m.checkInRate}%</span></div></td>
                    <td>{m.goalsApproved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
