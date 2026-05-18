import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string;
  managerId?: string;
  department?: { id: string; name: string };
  manager?: { id: string; name: string };
}

interface Department {
  id: string;
  name: string;
}

interface SuccessState {
  email: string;
  tempPassword: string;
  message: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'EMPLOYEE', departmentId: '', managerId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<SuccessState | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [usersRes, deptRes] = await Promise.all([api.get('/users'), api.get('/users/departments')]);
        if (isMounted) {
          setUsers(usersRes.data);
          setDepartments(deptRes.data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const managers = users.filter((u) => u.role === 'MANAGER');

  const handleCreate = async () => {
    setError('');
    setSuccess(null);
    try {
      const res = await api.post('/users', form);
      setSuccess({
        email: form.email,
        tempPassword: res.data.temporaryPassword,
        message: res.data.message,
      });
      setShowForm(false);
      setForm({ name: '', email: '', role: 'EMPLOYEE', departmentId: '', managerId: '' });
      
      // Refresh users list
      try {
        const [usersRes, deptRes] = await Promise.all([api.get('/users'), api.get('/users/departments')]);
        setUsers(usersRes.data);
        setDepartments(deptRes.data);
      } catch (err) {
        console.error('Failed to refresh user list:', err);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header page-header-row">
        <div><h1 className="page-title">User Management</h1><p className="page-subtitle">Manage employees, managers, and admins</p></div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setSuccess(null); }}>+ Add User</button>
      </div>
      {success && (
        <div className="alert-success">
          <div className="alert-success-header">
            <div className="alert-success-content">
              <p className="alert-success-title">✅ Account Created Successfully!</p>
              <p className="alert-success-message">{success.message}</p>
              <div className="credentials-box">
                <p className="credentials-item"><strong>Email:</strong> {success.email}</p>
                <p className="credentials-item"><strong>Temp Password:</strong> {success.tempPassword}</p>
                <p className="credentials-item warning">⚠️ Employee must change password after first login</p>
              </div>
            </div>
            <button onClick={() => setSuccess(null)} className="alert-success-close">✕</button>
          </div>
        </div>
      )}
      <div className="table-container">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Manager</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="fw-600">{u.name}</td>
                <td className="text-secondary">{u.email}</td>
                <td><span className={`badge badge-${u.role === 'ADMIN' ? 'locked' : u.role === 'MANAGER' ? 'submitted' : 'draft'}`}>{u.role}</span></td>
                <td>{u.department?.name || '—'}</td>
                <td className="text-secondary">{u.manager?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Create New Employee Account</h3><button className="modal-close" onClick={() => setShowForm(false)}>✕</button></div>
            {error && <div className="login-error">{error}</div>}
            <div className="alert-info">
              ℹ️ A temporary password will be auto-generated and sent to the employee's email.
            </div>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" /></div>
            <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Role</label>
                <select className="form-select" title="Select user role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="EMPLOYEE">Employee</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Department</label>
                <select className="form-select" title="Select department" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                  <option value="">None</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            {form.role === 'EMPLOYEE' && (
              <div className="form-group"><label className="form-label">Manager</label>
                <select className="form-select" title="Select manager" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
                  <option value="">None</option>{managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            )}
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}>Create</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
