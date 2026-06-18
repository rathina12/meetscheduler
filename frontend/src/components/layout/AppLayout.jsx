import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Calendar, LayoutDashboard, Plus, Bell, User, LogOut,
  Sun, Moon, Menu, X, Clock, Users, Settings, Link as LinkIcon
} from 'lucide-react';
import { getInitials, getAvatarColor } from '../../utils/helpers';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/meetings', icon: Clock, label: 'My Meetings' },
  { to: '/meetings/new', icon: Plus, label: 'New Meeting' },
  { to: '/notifications', icon: Bell, label: 'Notifications', badgeKey: 'notifications' },
  { to: '/calendar-sync', icon: LinkIcon, label: 'Calendar Sync' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function AppLayout({ children, unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">📅</div>
          MeetScheduler
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {NAV_ITEMS.map(({ to, icon: Icon, label, badgeKey }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <Icon size={18} />
              {label}
              {badgeKey === 'notifications' && unreadCount > 0 && (
                <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div className="avatar" style={{ background: getAvatarColor(user?.name || '') }}>
              {getInitials(user?.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ color: '#fca5a5' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn btn-ghost btn-icon"
              style={{ display: 'none' }}
              id="menu-btn"
              onClick={() => setSidebarOpen(s => !s)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {/* Mobile menu button via CSS */}
            <button className="btn btn-ghost btn-icon mobile-menu-btn"
              onClick={() => setSidebarOpen(s => !s)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <div className="topbar-right">
            <button className="btn btn-ghost btn-icon" onClick={toggle}
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }}
              onClick={() => navigate('/notifications')}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '4px', right: '4px',
                  width: '8px', height: '8px',
                  background: 'var(--danger)', borderRadius: '50%',
                  border: '2px solid var(--bg-card)'
                }} />
              )}
            </button>

            <button className="btn btn-ghost" onClick={() => navigate('/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px' }}>
              <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.7rem',
                background: getAvatarColor(user?.name || '') }}>
                {getInitials(user?.name)}
              </div>
              <span className="text-sm font-semibold">{user?.name?.split(' ')[0]}</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="page-body">{children}</main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
