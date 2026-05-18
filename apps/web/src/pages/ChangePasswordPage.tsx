import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function ChangePasswordPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const forced = !!user?.mustChangePassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      await refreshUser();
      setSuccess('Password updated successfully. Redirecting…');
      setTimeout(() => {
        if (user?.role === 'ADMIN') navigate('/admin/dashboard');
        else if (user?.role === 'MANAGER') navigate('/manager/team');
        else navigate('/employee/goals');
      }, 900);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <h1>Change Password</h1>
          <p>
            {forced
              ? 'You must set a new password before continuing.'
              : 'Update the password on your account.'}
          </p>
        </div>

        {forced && (
          <div className="alert-info" style={{ marginBottom: 12, fontSize: '0.85rem' }}>
            💡 Don't know your current password? Ask your administrator to use
            <strong> Admin → Users → Send Password</strong> on your account — they'll
            email you a temporary password to enter here.
          </div>
        )}

        {error && <div className="login-error">{error}</div>}
        {success && <div className="alert-info cp-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="cp-current">Current password</label>
            <input
              id="cp-current"
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cp-new">New password</label>
            <input
              id="cp-new"
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cp-confirm">Confirm new password</label>
            <input
              id="cp-confirm"
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary cp-btn-block" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </button>

          {forced && (
            <button
              type="button"
              className="btn btn-ghost cp-btn-block cp-btn-spaced"
              onClick={() => { logout(); navigate('/login'); }}
            >
              Sign out
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
