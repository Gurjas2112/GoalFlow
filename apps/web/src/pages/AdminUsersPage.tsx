import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE', departmentId: '', managerId: '' });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, deptRes] = await Promise.all([api.get('/users'), api.get('/users/departments')]);
      setUsers(usersRes.data);
      setDepartments(deptRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const managers = users.filter((u) => u.role === 'MANAGER');

  const handleCreate = async () => {
    setError('');
    try {
      await api.post('/users', form);
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'EMPLOYEE', departmentId: '', managerId: '' });
      fetchData();
    } catch (err: any) { setError(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header page-header-row">
        <div><h1 className="page-title">User Management</h1><p className="page-subtitle">Manage employees, managers, and admins</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add User</button>
      </div>
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
            <div className="modal-header"><h3 className="modal-title">Create User</h3><button className="modal-close" onClick={() => setShowForm(false)}>✕</button></div>
            {error && <div className="login-error">{error}</div>}
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="EMPLOYEE">Employee</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Department</label>
                <select className="form-select" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                  <option value="">None</option>{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            {form.role === 'EMPLOYEE' && (
              <div className="form-group"><label className="form-label">Manager</label>
                <select className="form-select" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
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
