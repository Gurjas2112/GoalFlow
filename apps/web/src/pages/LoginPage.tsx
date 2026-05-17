import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { msalInstance, loginRequest, isSSOConfigured } from '../lib/msalConfig';
import { api } from '../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Pre-fill demo user if coming from homepage demo buttons
  useEffect(() => {
    const demoUser = localStorage.getItem('demoUser');
    if (demoUser) {
      try {
        const { email: de, password: dp } = JSON.parse(demoUser);
        setEmail(de);
        setPassword(dp);
        localStorage.removeItem('demoUser');
      } catch { /* ignore */ }
    }
  }, []);

  const doLogin = async (em: string, pw: string) => {
    setError('');
    setLoading(true);
    try {
      await login(em, pw);
      const stored = localStorage.getItem('goalflow_user');
      const user = stored ? JSON.parse(stored) : null;
      if (user?.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user?.role === 'MANAGER') navigate('/manager/team');
      else navigate('/employee/goals');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doLogin(email, password); };

  const quickLogins = [
    { label: 'Admin', email: 'admin@goalflow.demo', pw: 'Admin@123', icon: '🛡️', desc: 'Full system access' },
    { label: 'Manager', email: 'manager@goalflow.demo', pw: 'Manager@123', icon: '👥', desc: 'Team oversight' },
    { label: 'Employee 1', email: 'emp1@goalflow.demo', pw: 'Emp@123', icon: '🎯', desc: 'Locked goals' },
    { label: 'Employee 2', email: 'emp2@goalflow.demo', pw: 'Emp@123', icon: '📝', desc: 'Draft goals' },
  ];

  return (
    <div className="login-page">
      {/* Animated background orbs */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)',
        top: '10%', left: '10%', animation: 'float 8s ease-in-out infinite', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1), transparent 70%)',
        bottom: '10%', right: '15%', animation: 'float 10s ease-in-out infinite reverse', pointerEvents: 'none',
      }} />

      <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-30px); } }`}</style>

      <div className="login-card">
        <div className="login-brand">
          <img src="/logo.png" alt="GoalFlow" style={{ width: 56, height: 56, borderRadius: 16, marginBottom: 8, boxShadow: '0 8px 30px rgba(99,102,241,0.3)' }} />
          <h1>GoalFlow</h1>
          <p>Goal Setting & Tracking Portal</p>
        </div>

        {error && <div className="login-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8, padding: '0.75rem', fontSize: '0.9rem' }} type="submit" disabled={loading}>
            {loading ? '⏳ Signing in...' : '→ Sign In'}
          </button>
        </form>

        {isSSOConfigured() && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <button
              onClick={async () => {
                setError(''); setLoading(true);
                try {
                  await msalInstance.initialize();
                  const result = await msalInstance.loginPopup(loginRequest);
                  const res = await api.post('/auth/sso', { accessToken: result.accessToken, profile: { mail: result.account?.username, displayName: result.account?.name, groups: (result as any).idTokenClaims?.groups || [] } });
                  localStorage.setItem('goalflow_token', res.data.token);
                  localStorage.setItem('goalflow_user', JSON.stringify(res.data.user));
                  window.location.href = res.data.user.role === 'ADMIN' ? '/admin/dashboard' : res.data.user.role === 'MANAGER' ? '/manager/team' : '/employee/goals';
                } catch (err: any) { setError(err.message || 'SSO login failed'); }
                setLoading(false);
              }}
              style={{
                width: '100%', padding: '0.75rem', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)',
                color: 'var(--text)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'var(--transition)', fontFamily: 'var(--font)',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--border-hover)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; }}
            >
              <svg width="20" height="20" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
              Sign in with Microsoft
            </button>
          </div>
        )}

        <div style={{ marginTop: 28, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Quick Demo Access</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {quickLogins.map((ql) => (
              <button
                key={ql.label}
                onClick={() => { setEmail(ql.email); setPassword(ql.pw); doLogin(ql.email, ql.pw); }}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '0.7rem 0.8rem',
                  cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)',
                  color: 'var(--text)',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--border-hover)'; (e.target as HTMLElement).style.background = 'var(--accent-glow)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; (e.target as HTMLElement).style.background = 'var(--bg-input)'; }}
              >
                <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{ql.icon}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{ql.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ql.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Don't have an account?{' '}
            <button onClick={() => navigate('/signup')} style={{ color: 'var(--accent-hover)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>Sign up here</button>
          </p>
        </div>
        <button onClick={() => navigate('/')} style={{ width: '100%', marginTop: 8, padding: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'var(--font)' }}>← Back to Home</button>
      </div>
    </div>
  );
}
