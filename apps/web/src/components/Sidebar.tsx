import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>GoalFlow</h1>
        <p>Goal Setting & Tracking</p>
      </div>
      <nav className="sidebar-nav">
        {user.role === 'EMPLOYEE' && (
          <>
            <div className="sidebar-section-title">My Work</div>
            <NavLink to="/employee/goals" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>📋 My Goals</NavLink>
            <NavLink to="/employee/checkin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>✅ Check-in</NavLink>
          </>
        )}
        {user.role === 'MANAGER' && (
          <>
            <div className="sidebar-section-title">Team</div>
            <NavLink to="/manager/team" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>👥 Team Goals</NavLink>
          </>
        )}
        {user.role === 'ADMIN' && (
          <>
            <div className="sidebar-section-title">Overview</div>
            <NavLink to="/admin/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>📊 Dashboard</NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>👤 Users</NavLink>
            <NavLink to="/admin/cycles" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>🔄 Cycles</NavLink>
            <div className="sidebar-section-title">Reports</div>
            <NavLink to="/admin/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>📈 Reports</NavLink>
            <NavLink to="/admin/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>📉 Analytics</NavLink>
            <NavLink to="/admin/audit" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>🔍 Audit Log</NavLink>
            <NavLink to="/admin/escalations" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>⚠️ Escalations</NavLink>
          </>
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={handleLogout}>Sign Out</button>
      </div>
    </aside>
  );
}
