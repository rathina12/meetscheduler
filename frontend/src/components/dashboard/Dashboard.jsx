import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatTime, formatDate, getDayLabel, getMeetingStatusClass, getMeetingTypeClass } from '../../utils/helpers';
import { Calendar, Clock, Users, Bell, Plus, ChevronRight, Video, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [todayMeetings, setTodayMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([meetingsAPI.getDashboard(), meetingsAPI.getToday()])
      .then(([statsRes, todayRes]) => {
        setStats(statsRes.data.data);
        setTodayMeetings(todayRes.data.data || []);
      })
      .catch(() => setError('We could not load your schedule. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="loading-spinner" />
    </div>
  );

  const STAT_CARDS = [
    { label: 'Total Meetings', value: stats?.totalMeetings ?? '—', icon: '📅', color: '#6156e8', bg: 'var(--primary-light)' },
    { label: "Today's Meetings", value: stats?.todayMeetings ?? '—', icon: '🕐', color: '#0891b2', bg: '#e0f2fe' },
    { label: 'Upcoming', value: stats?.upcomingMeetings ?? '—', icon: '⏰', color: '#059669', bg: '#dcfce7' },
    { label: 'Pending Invites', value: stats?.pendingInvites ?? '—', icon: '📬', color: '#d97706', bg: '#fef3c7' },
  ];

  return (
    <div>
      <section className="ms-hero" aria-label="Your meeting overview">
        <div className="ms-header">
          <div>
            <span className="ms-kicker">Your workspace · {format(new Date(), 'EEEE')}</span>
            <h1>Good {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}!</h1>
            <p>{format(new Date(), 'MMMM d, yyyy')} · Make room for what matters.</p>
          </div>
          <button className="btn" onClick={() => navigate('/meetings/new')}>
            <Plus size={17} /> Schedule meeting
          </button>
        </div>
      </section>
      {error && <div role="alert" className="ms-error">{error}</div>}

      {/* Stats */}
      <div className="stats-grid">
        {STAT_CARDS.map(({ label, value, icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: bg, color }}>
              <span style={{ fontSize: '24px' }}>{icon}</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Today's Schedule */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
            <h2 className="card-title" style={{ margin: 0 }}>Today's Schedule</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/calendar')}>
              View Calendar <ChevronRight size={14} />
            </button>
          </div>

          {todayMeetings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>No meetings scheduled today</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}
                onClick={() => navigate('/meetings/new')}>
                Schedule a meeting
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todayMeetings.map(meeting => (
                <MeetingRow key={meeting.id} meeting={meeting} onClick={() => navigate(`/meetings/${meeting.id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming meetings */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
            <h2 className="card-title" style={{ margin: 0 }}>Upcoming Meetings</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/meetings')}>
              View All <ChevronRight size={14} />
            </button>
          </div>

          {!stats?.nextMeetings?.length ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              <Clock size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>No upcoming meetings</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.nextMeetings.map(meeting => (
                <MeetingRow key={meeting.id} meeting={meeting} showDate
                  onClick={() => navigate(`/meetings/${meeting.id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MeetingRow({ meeting, showDate, onClick }) {
  return (
    <div className="meeting-item" role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }} onClick={onClick} style={{ padding: '12px', gap: '12px' }}>
      <div className="meeting-time-block">
        <div className="time">{formatTime(meeting.startTime)}</div>
        {showDate && <div className="date">{formatDate(meeting.startTime)}</div>}
      </div>
      <div className="meeting-info" style={{ minWidth: 0 }}>
        <div className="meeting-title"
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {meeting.title}
        </div>
        <div className="meeting-meta">
          {meeting.meetingType === 'ONLINE'
            ? <span><Video size={12} /> Online</span>
            : <span><MapPin size={12} /> {meeting.location || 'Offline'}</span>}
          {meeting.participants?.length > 0 && (
            <span><Users size={12} /> {meeting.participants.length} participants</span>
          )}
          <span className={`badge ${getMeetingStatusClass(meeting.status)}`}
            style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
            {meeting.status}
          </span>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
