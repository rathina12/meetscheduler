import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import { User, Mail, Globe, Moon, Sun, Shield, Key, Save, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TIMEZONES = [
  'UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
  'Europe/London','Europe/Paris','Europe/Berlin','Asia/Kolkata','Asia/Tokyo','Australia/Sydney',
];

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', timezone: user?.timezone || 'UTC' });
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setPass = k => e => setPassForm(f => ({ ...f, [k]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // In a real app, call PUT /api/users/me
      updateUser({ name: form.name, timezone: form.timezone });
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPass !== passForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passForm.newPass.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      // In a real app, call PUT /api/users/me/password
      toast.success('Password changed successfully');
      setPassForm({ current: '', newPass: '', confirm: '' });
    } catch {
      toast.error('Failed to change password');
    }
    setSaving(false);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>Profile & Settings</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Sidebar */}
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div className="avatar avatar-lg" style={{ margin: '0 auto 16px',
            background: getAvatarColor(user?.name || ''), fontSize: '1.75rem' }}>
            {getInitials(user?.name)}
          </div>
          <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>{user?.name}</h3>
          <p className="text-sm text-muted">{user?.email}</p>
          <span className="badge" style={{ margin: '8px auto 0', background: '#dbeafe', color: '#1d4ed8', display: 'inline-flex' }}>
            <Shield size={12} /> {user?.role}
          </span>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            {[
              { key: 'profile', icon: <User size={16} />, label: 'Profile' },
              { key: 'security', icon: <Key size={16} />, label: 'Security' },
              { key: 'preferences', icon: <Sun size={16} />, label: 'Preferences' },
            ].map(({ key, icon, label }) => (
              <button key={key} className={`nav-item ${tab === key ? 'active' : ''}`}
                onClick={() => setTab(key)} style={{ width: '100%', justifyContent: 'flex-start',
                  color: tab === key ? '#fff' : 'var(--text)', marginBottom: '4px' }}>
                {icon} {label}
              </button>
            ))}

            <button className="nav-item" onClick={handleLogout}
              style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444', marginTop: '8px' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          {tab === 'profile' && (
            <div className="card">
              <h2 className="card-title"><User size={18} style={{ display: 'inline', marginRight: '8px' }} />Personal Information</h2>
              <form onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.name} onChange={set('name')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" value={user?.email} disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  <p className="text-xs text-muted" style={{ marginTop: '4px' }}>Email cannot be changed</p>
                </div>
                <div className="form-group">
                  <label className="form-label"><Globe size={14} style={{ display: 'inline', marginRight: '4px' }} />Timezone</label>
                  <select className="form-select" value={form.timezone} onChange={set('timezone')}>
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {tab === 'security' && (
            <div className="card">
              <h2 className="card-title"><Key size={18} style={{ display: 'inline', marginRight: '8px' }} />Change Password</h2>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-input" value={passForm.current} onChange={setPass('current')} />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" value={passForm.newPass} onChange={setPass('newPass')}
                    placeholder="Minimum 8 characters" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-input" value={passForm.confirm} onChange={setPass('confirm')} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Key size={16} /> {saving ? 'Changing...' : 'Change Password'}
                </button>
              </form>

              <div style={{ marginTop: '32px', padding: '16px', background: 'var(--bg)',
                borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ marginBottom: '8px', fontSize: '0.9rem' }}>Password Tips</h4>
                <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  <li>Use at least 8 characters</li>
                  <li>Mix uppercase, lowercase, numbers and symbols</li>
                  <li>Don't reuse passwords across services</li>
                </ul>
              </div>
            </div>
          )}

          {tab === 'preferences' && (
            <div className="card">
              <h2 className="card-title">Preferences</h2>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Dark Mode</h4>
                    <p className="text-sm text-muted">Switch between light and dark themes</p>
                  </div>
                  <button className="btn btn-secondary" onClick={toggle} style={{ gap: '8px' }}>
                    {theme === 'dark' ? <><Sun size={16} /> Light</> : <><Moon size={16} /> Dark</>}
                  </button>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Email Notifications</h4>
                    <p className="text-sm text-muted">Receive email for meeting invites and updates</p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Meeting Reminders</h4>
                    <p className="text-sm text-muted">Get reminded 15 minutes before each meeting</p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
