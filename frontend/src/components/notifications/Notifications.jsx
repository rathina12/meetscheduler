import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../../services/api';
import { formatRelative } from '../../utils/helpers';
import { Bell, CheckCheck, Calendar, RefreshCw, X, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  MEETING_INVITE:    { icon: '📅', color: '#4f46e5', bg: '#eef2ff', label: 'Invitation' },
  MEETING_UPDATE:    { icon: '✏️', color: '#0891b2', bg: '#e0f2fe', label: 'Updated' },
  MEETING_CANCELLED: { icon: '❌', color: '#dc2626', bg: '#fee2e2', label: 'Cancelled' },
  MEETING_REMINDER:  { icon: '⏰', color: '#d97706', bg: '#fef3c7', label: 'Reminder' },
  RESPONSE_UPDATE:   { icon: '💬', color: '#059669', bg: '#dcfce7', label: 'Response' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsAPI.getAll();
      setNotifications(data.data || []);
    } catch {}
    setLoading(false);
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readStatus: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
      toast.success('All notifications marked as read');
    } catch {}
  };

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.readStatus;
    if (filter === 'READ') return n.readStatus;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Notifications</h1>
          <p className="text-muted text-sm">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead}>
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="tabs" style={{ marginBottom: '20px' }}>
        {['ALL', 'UNREAD', 'READ'].map(f => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}
            {f === 'UNREAD' && unreadCount > 0 && (
              <span style={{ marginLeft: '6px', background: 'var(--primary)', color: '#fff',
                borderRadius: '99px', padding: '1px 6px', fontSize: '0.7rem' }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-spinner" />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
            <h3 style={{ marginBottom: '8px' }}>No notifications</h3>
            <p className="text-muted text-sm">
              {filter === 'UNREAD' ? "You're all caught up!" : 'No notifications yet'}
            </p>
          </div>
        ) : (
          filtered.map(n => <NotifItem key={n.id} notif={n}
            onRead={() => handleMarkRead(n.id)}
            onNavigate={n.meetingId ? () => navigate(`/meetings/${n.meetingId}`) : null} />)
        )}
      </div>
    </div>
  );
}

function NotifItem({ notif, onRead, onNavigate }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.MEETING_INVITE;

  return (
    <div className={`notif-item ${!notif.readStatus ? 'unread' : ''}`}
      onClick={() => { if (!notif.readStatus) onRead(); if (onNavigate) onNavigate(); }}>
      {/* Icon */}
      <div style={{ width: '40px', height: '40px', borderRadius: '10px',
        background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', flexShrink: 0 }}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <span style={{ display: 'inline-block', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px',
                borderRadius: '99px', background: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </span>
            </span>
            <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5 }}>
              {notif.message}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {formatRelative(notif.createdAt)}
            </p>
          </div>
          {!notif.readStatus && (
            <div style={{ width: '8px', height: '8px', borderRadius: '50%',
              background: 'var(--primary)', flexShrink: 0, marginTop: '6px' }} />
          )}
        </div>
      </div>
    </div>
  );
}
