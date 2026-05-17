import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { GoalStatusBadge } from '../components/Shared';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, submitted: 0, approved: 0, draft: 0, locked: 0 });
  const [pendingSheets, setPendingSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [usersRes, sheetsRes] = await Promise.all([
          api.get('/users'),
          api.get('/goal-sheets/team'),
        ]);
        const sheets = sheetsRes.data;
        const employees = usersRes.data.filter((u: any) => u.role === 'EMPLOYEE');
        setStats({
          totalUsers: employees.length,
          submitted: sheets.filter((s: any) => s.status === 'SUBMITTED').length,
          approved: sheets.filter((s: any) => ['APPROVED', 'LOCKED'].includes(s.status)).length,
          draft: sheets.filter((s: any) => s.status === 'DRAFT').length,
          locked: sheets.filter((s: any) => s.status === 'LOCKED').length,
        });
        setPendingSheets(sheets.filter((s: any) => s.status === 'SUBMITTED').slice(0, 10));
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const cards = [
    { label: 'Total Employees', value: stats.totalUsers, icon: '👥', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
    { label: 'Goals Submitted', value: stats.submitted, icon: '📋', gradient: 'linear-gradient(135deg, #a855f7, #c084fc)' },
    { label: 'Goals Approved', value: stats.approved, icon: '✅', gradient: 'linear-gradient(135deg, #34d399, #06b6d4)' },
    { label: 'In Draft', value: stats.draft, icon: '📝', gradient: 'linear-gradient(135deg, #fbbf24, #fb923c)' },
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>{greeting()}, {user?.name?.split(' ')[0]} 👋</p>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Organization-wide goal tracking overview</p>
      </div>

      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, fontSize: '1.8rem', opacity: 0.6 }}>{c.icon}</div>
            <div className="stat-value" style={{ background: c.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Quick summary bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24,
      }}>
        {[
          { label: 'Approval Rate', value: stats.totalUsers > 0 ? Math.round((stats.approved / stats.totalUsers) * 100) + '%' : '0%', color: 'var(--success)' },
          { label: 'Pending Review', value: stats.submitted, color: 'var(--warning)' },
          { label: 'Locked Goals', value: stats.locked, color: 'var(--accent-hover)' },
        ].map((m) => (
          <div key={m.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '1rem 1.25rem',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {pendingSheets.length > 0 && (
        <div className="card" style={{ animation: 'pulseGlow 3s ease-in-out infinite' }}>
          <div className="card-header">
            <h3 className="card-title">⚡ Pending Approvals</h3>
            <span className="badge badge-submitted">{pendingSheets.length} awaiting</span>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th>Goals</th><th>Submitted</th><th>Status</th></tr></thead>
              <tbody>
                {pendingSheets.map((s: any) => (
                  <tr key={s.id}>
                    <td className="fw-600">{s.user?.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.user?.department?.name || '—'}</td>
                    <td>{s.goals?.length || 0}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '—'}</td>
                    <td><GoalStatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pendingSheets.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎯</div>
          <h3 style={{ fontWeight: 800, marginBottom: 6 }}>All caught up!</h3>
          <p style={{ color: 'var(--text-secondary)' }}>No pending goal sheet approvals.</p>
        </div>
      )}
    </div>
  );
}
