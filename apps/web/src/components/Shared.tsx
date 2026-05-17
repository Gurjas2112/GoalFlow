
import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PrivateRoute({ children, role }: { children: ReactNode; role?: string }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (role && !role.split('|').includes(user.role)) return <Navigate to="/login" />;
  return <>{children}</>;
}

export function GoalStatusBadge({ status }: { status: string }) {
  const cls = `badge badge-${status.toLowerCase()}`;
  return <span className={cls}>{status.replace('_', ' ')}</span>;
}

export function AchievementStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { NOT_STARTED: 'not-started', ON_TRACK: 'on-track', COMPLETED: 'completed' };
  return <span className={`badge badge-${map[status] || 'draft'}`}>{status.replace(/_/g, ' ')}</span>;
}

export function UoMBadge({ type }: { type: string }) {
  const labels: Record<string, string> = { NUMERIC_MIN: '↑ Min', NUMERIC_MAX: '↓ Max', TIMELINE: '📅 Date', ZERO: '0 Zero' };
  return <span className="badge badge-locked">{labels[type] || type}</span>;
}

export function ScoreDisplay({ score }: { score?: number | null }) {
  if (score == null) return <span className="text-secondary">—</span>;
  const pct = Math.round(score * 100);
  const cls = pct >= 80 ? 'score-high' : pct >= 50 ? 'score-mid' : 'score-low';
  return <span className={`score ${cls}`}>{pct}%</span>;
}

export function WeightageMeter({ current, total = 100 }: { current: number; total?: number }) {
  const pct = Math.min((current / total) * 100, 100);
  const color = current === total ? 'var(--color-success)' : current > total ? 'var(--color-danger)' : 'var(--color-warning)';
  return (
    <div className="weightage-meter">
      <div className="weightage-bar">
        <div className="weightage-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="weightage-label">
        <span style={{ color }}>{current}% / {total}%</span>
        <span className="text-secondary">{current === total ? '✓ Ready' : current > total ? 'Over limit' : `${total - current}% remaining`}</span>
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return <div className="loading-page"><div className="spinner" /></div>;
}

export function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = 'Confirm', danger = false }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmText?: string; danger?: boolean;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <p className="text-secondary text-sm">{message}</p>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export function CycleWindowBanner({ cycle }: { cycle: any }) {
  if (!cycle) return null;
  return (
    <div className="cycle-banner">
      <div>
        <span className="cycle-banner-phase">{cycle.phase.replace('_', ' ')} {cycle.year}</span>
        {cycle.isOverride && <span className="badge badge-submitted" style={{ marginLeft: 8 }}>Override Active</span>}
      </div>
      <span className="cycle-banner-dates">
        {new Date(cycle.openDate).toLocaleDateString()} — {new Date(cycle.closeDate).toLocaleDateString()}
      </span>
    </div>
  );
}
