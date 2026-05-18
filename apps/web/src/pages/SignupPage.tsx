import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPw: '', department: '' });
  const [pwStrength, setPwStrength] = useState(0);

  const departments = ['Engineering', 'Sales', 'HR & People', 'Finance', 'Marketing', 'Operations', 'Other'];

  const checkStrength = (pw: string): void => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    setPwStrength(s);
  };

  const set = (k: string, v: string): void => {
    setForm(p => ({ ...p, [k]: v }));
    if (k === 'password') checkStrength(v);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password || !form.department) {
      setError('Please fill in all fields');
      return;
    }
    if (form.password !== form.confirmPw) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/signup', {
        name: form.name,
        email: form.email,
        password: form.password,
        department: form.department
      });
      setStep(2);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError;
      setError(axiosErr.response?.data?.error || axiosErr.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#f87171', '#fbbf24', '#34d399', '#06b6d4'];

  if (step === 2) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="text-center">
            <div className="login-icon">🎉</div>
            <h1 className="login-heading">Account Created!</h1>
          </div>
          <div className="alert-success">
            <div className="alert-success-content">
              <p className="alert-success-message">Confirmation sent to:</p>
              <p className="success-email">{form.email}</p>
              <p className="alert-success-message spacer">For demo, your account is already active!</p>
            </div>
          </div>
          <button className="btn btn-primary btn-full-width primary-small" onClick={() => navigate('/login')}>Go to Login →</button>
          <button className="btn btn-ghost btn-full-width ghost-small" onClick={() => navigate('/')}>← Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="text-center">
          <img src="/logo.png" alt="GoalFlow" className="login-card-logo" />
          <h1 className="login-heading">Create Account</h1>
          <p className="login-subheading">Join GoalFlow and start tracking goals</p>
        </div>

        {error && <div className="login-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input className="input-with-icon" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
              <input className="input-with-icon" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <div className="input-wrapper">
              <span className="input-icon">🏢</span>
              <select className="input-with-icon" title="Select your department" value={form.department} onChange={e => set('department', e.target.value)}>
                <option value="">Select your department...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                className="input-with-icon"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="password-toggle"
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {form.password && (
              <div className="strength-meter">
                <div className="strength-meter-header">
                  <span className="strength-meter-label">Strength:</span>
                  <span className="strength-meter-text" style={{ color: strengthColors[pwStrength] }}>
                    {strengthLabels[pwStrength]}
                  </span>
                </div>
                <div className="strength-meter-bar">
                  <div
                    className="strength-meter-fill"
                    style={{
                      width: `${(pwStrength / 4) * 100}%`,
                      background: strengthColors[pwStrength]
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                className="input-with-icon"
                type="password"
                value={form.confirmPw}
                onChange={e => set('confirmPw', e.target.value)}
                placeholder="Re-enter your password"
              />
            </div>
            {form.confirmPw && form.password !== form.confirmPw && (
              <p className="field-error">Passwords do not match</p>
            )}
          </div>

          <button
            className="btn btn-primary btn-full-width primary-small"
            type="submit"
            disabled={loading}
          >
            {loading ? '⏳ Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <div className="text-center form-center-footer">
          <p className="form-footer-text">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="form-footer-link"
            >
              Login here
            </button>
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="form-back-button"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
