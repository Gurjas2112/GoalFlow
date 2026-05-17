import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPw: '', department: '' });
  const [pwStrength, setPwStrength] = useState(0);

  const departments = ['Engineering', 'Sales', 'HR & People', 'Finance', 'Marketing', 'Operations', 'Other'];

  const checkStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    setPwStrength(s);
  };

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    if (k === 'password') checkStrength(v);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password || !form.department) { setError('Please fill in all fields'); return; }
    if (form.password !== form.confirmPw) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setTimeout(() => { setStep(2); setLoading(false); }, 1000);
  };

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#f87171', '#fbbf24', '#34d399', '#06b6d4'];

  const inputStyle = { width: '100%', padding: '12px 14px 12px 44px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: '0.88rem', fontFamily: 'var(--font)', outline: 'none', transition: 'var(--transition)' };
  const labelStyle = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 };

  if (step === 2) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ maxWidth: 460 }}>
          <div className="text-center" style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎉</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text)' }}>Account Created!</h1>
          </div>
          <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: 20, textAlign: 'center', marginBottom: 20 }}>
            <p style={{ color: 'var(--success)', fontSize: '0.88rem' }}>Confirmation sent to:</p>
            <p style={{ color: 'var(--text)', fontWeight: 700, wordBreak: 'break-all' }}>{form.email}</p>
            <p style={{ color: 'var(--success)', fontSize: '0.78rem', marginTop: 8 }}>For demo, your account is already active!</p>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }} onClick={() => navigate('/login')}>Go to Login →</button>
          <button className="btn btn-ghost" style={{ width: '100%', marginTop: 10, padding: '10px' }} onClick={() => navigate('/')}>← Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 460 }}>
        <div className="text-center" style={{ marginBottom: 24 }}>
          <img src="/logo.png" alt="GoalFlow" style={{ width: 48, height: 48, borderRadius: 14, marginBottom: 8 }} />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text)' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>Join GoalFlow and start tracking goals</p>
        </div>

        {error && <div className="login-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={labelStyle}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, fontSize: '1rem' }}>👤</span>
              <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" />
            </div>
          </div>
          <div className="form-group">
            <label style={labelStyle}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, fontSize: '1rem' }}>📧</span>
              <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
            </div>
          </div>
          <div className="form-group">
            <label style={labelStyle}>Department</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, fontSize: '1rem' }}>🏢</span>
              <select style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' as const }} value={form.department} onChange={e => set('department', e.target.value)}>
                <option value="">Select your department...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, fontSize: '1rem' }}>🔒</span>
              <input style={inputStyle} type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: 10, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>{showPw ? '🙈' : '👁️'}</button>
            </div>
            {form.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Strength:</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: strengthColors[pwStrength] }}>{strengthLabels[pwStrength]}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(75,85,120,0.2)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${(pwStrength / 4) * 100}%`, background: strengthColors[pwStrength], borderRadius: 2, transition: 'all 0.3s' }} />
                </div>
              </div>
            )}
          </div>
          <div className="form-group">
            <label style={labelStyle}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, fontSize: '1rem' }}>🔒</span>
              <input style={inputStyle} type="password" value={form.confirmPw} onChange={e => set('confirmPw', e.target.value)} placeholder="Re-enter your password" />
            </div>
            {form.confirmPw && form.password !== form.confirmPw && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4 }}>Passwords do not match</p>}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: 8, fontSize: '0.9rem' }} type="submit" disabled={loading}>
            {loading ? '⏳ Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <div className="text-center" style={{ marginTop: 20 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Already have an account? <button onClick={() => navigate('/login')} style={{ color: 'var(--accent-hover)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>Login here</button>
          </p>
        </div>
        <button onClick={() => navigate('/')} style={{ width: '100%', marginTop: 12, padding: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'var(--font)' }}>← Back to Home</button>
      </div>
    </div>
  );
}
