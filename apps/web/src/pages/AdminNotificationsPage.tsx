import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface NotificationLog {
  event: string;
  recipient: string;
  channel: 'EMAIL' | 'TEAMS';
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  attempt: number;
  error?: string;
  timestamp: string;
}

export default function AdminNotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/notifications/log');
      setLogs(response.data);
    } catch (err) {
      console.error('Failed to fetch notification logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const successCount = logs.filter((l) => l.status === 'SUCCESS').length;
  const retryingCount = logs.filter((l) => l.status === 'RETRYING').length;
  const failedCount = logs.filter((l) => l.status === 'FAILED').length;

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      SUCCESS: 'var(--success)',
      RETRYING: 'var(--warning)',
      FAILED: 'var(--danger)',
    };
    return (
      <span
        className="badge"
        style={{
          background: colors[status] || 'var(--text-muted)',
          color: '#fff',
          fontSize: 11,
          padding: '3px 10px',
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>📧 Notification History</h2>
          <p className="page-subtitle">
            Real-time email &amp; Teams notification log with retry tracking
          </p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <span style={{ fontSize: 13, opacity: 0.8 }}>Auto-refresh (3s)</span>
          {autoRefresh && (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
          )}
        </label>
      </div>

      {/* Stats cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-label">✅ Delivered</div>
          <div className="stat-value">{successCount}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-label">⏳ Retrying</div>
          <div className="stat-value">{retryingCount}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="stat-label">❌ Failed</div>
          <div className="stat-value">{failedCount}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-label">📊 Total</div>
          <div className="stat-value">{logs.length}</div>
        </div>
      </div>

      {/* Notification log table */}
      <div className="card">
        <div className="card-header">
          <h3>Recent Notifications</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" />
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', opacity: 0.6 }}>
              <p style={{ fontSize: 18, marginBottom: 8 }}>📭 No notifications yet</p>
              <p style={{ fontSize: 13 }}>
                Submit a goal sheet to trigger email + Teams notifications.
              </p>
            </div>
          ) : (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Channel</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Attempt</th>
                  <th>Time</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {logs
                  .slice()
                  .reverse()
                  .map((log, idx) => (
                    <tr key={idx}>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.event}</td>
                      <td>
                        <span className="badge" style={{ background: log.channel === 'EMAIL' ? 'var(--primary)' : '#7c3aed', color: '#fff', fontSize: 10 }}>
                          {log.channel === 'EMAIL' ? '📧 Email' : '💬 Teams'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{log.recipient}</td>
                      <td>{statusBadge(log.status)}</td>
                      <td style={{ textAlign: 'center' }}>{log.attempt}</td>
                      <td style={{ fontSize: 12 }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td style={{ fontSize: 11, color: 'var(--danger)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.error || '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p style={{ fontSize: 12, opacity: 0.5, marginTop: 16, textAlign: 'center' }}>
        💡 Trigger notifications by submitting, approving, or returning a goal sheet. Watch them appear here in real-time!
      </p>
    </div>
  );
}
