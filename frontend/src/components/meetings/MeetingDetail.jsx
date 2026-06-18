import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingsAPI } from '../../services/api';
import { formatDateTime, getMeetingStatusClass, getMeetingTypeClass, getInitials, getAvatarColor } from '../../utils/helpers';
import { ArrowLeft, Edit, XCircle, Trash2, Video, MapPin, Users, Calendar,
  Clock, CheckCircle, XOctagon, HelpCircle, Link, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const RESPONSE_ICONS = {
  ACCEPTED: <CheckCircle size={14} color="#16a34a" />,
  DECLINED: <XOctagon size={14} color="#dc2626" />,
  TENTATIVE: <HelpCircle size={14} color="#d97706" />,
  PENDING: <Clock size={14} color="#94a3b8" />,
};

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => { loadMeeting(); }, [id]);

  const loadMeeting = async () => {
    setLoading(true);
    try {
      const { data } = await meetingsAPI.getById(id);
      setMeeting(data.data);
    } catch {
      toast.error('Meeting not found');
      navigate('/meetings');
    }
    setLoading(false);
  };

  const handleRespond = async (status) => {
    setResponding(true);
    try {
      await meetingsAPI.respond({ meetingId: Number(id), status });
      toast.success(`Response: ${status}`);
      loadMeeting();
    } catch {}
    setResponding(false);
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this meeting?')) return;
    try {
      await meetingsAPI.cancel(id);
      toast.success('Meeting cancelled');
      loadMeeting();
    } catch {}
  };

  if (loading) return <div className="loading-spinner" />;
  if (!meeting) return null;

  const isOnline = meeting.meetingType === 'ONLINE';

  return (
    <div>
      {/* Back */}
      <button className="btn btn-ghost" onClick={() => navigate('/meetings')}
        style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Meetings
      </button>

      {/* Header card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="flex justify-between items-start" style={{ marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{meeting.title}</h1>
              <span className={`badge ${getMeetingStatusClass(meeting.status)}`}>{meeting.status}</span>
              <span className={`badge ${getMeetingTypeClass(meeting.meetingType)}`}>{meeting.meetingType}</span>
              {meeting.isRecurring && <span className="badge" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                <RefreshCw size={12} /> Recurring
              </span>}
            </div>
            {meeting.description && (
              <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                {meeting.description}
              </p>
            )}
          </div>

          {meeting.status === 'SCHEDULED' && (
            <div className="flex gap-2" style={{ marginLeft: '16px', flexShrink: 0 }}>
              <button className="btn btn-secondary btn-sm"
                onClick={() => navigate(`/meetings/${id}/edit`)}>
                <Edit size={14} /> Edit
              </button>
              <button className="btn btn-sm" onClick={handleCancel}
                style={{ background: '#fef3c7', color: '#d97706', border: 'none' }}>
                <XCircle size={14} /> Cancel
              </button>
            </div>
          )}
        </div>

        {/* Meta grid */}
        <div className="grid-2" style={{ gap: '16px' }}>
          <InfoRow icon={<Calendar size={16} />} label="Start" value={formatDateTime(meeting.startTime)} />
          <InfoRow icon={<Clock size={16} />} label="End" value={formatDateTime(meeting.endTime)} />
          <InfoRow icon={isOnline ? <Video size={16} /> : <MapPin size={16} />}
            label={isOnline ? 'Meeting Link' : 'Location'}
            value={isOnline
              ? (meeting.meetingLink
                ? <a href={meeting.meetingLink} target="_blank" rel="noreferrer"
                    style={{ color: 'var(--primary)' }}>{meeting.meetingLink}</a>
                : 'No link provided')
              : (meeting.location || 'Not specified')} />
          <InfoRow icon={<Users size={16} />} label="Organizer"
            value={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="avatar" style={{ width: '24px', height: '24px', fontSize: '0.65rem',
                  background: getAvatarColor(meeting.organizer?.name || '') }}>
                  {getInitials(meeting.organizer?.name)}
                </div>
                <span>{meeting.organizer?.name} ({meeting.organizer?.email})</span>
              </div>} />
        </div>

        {/* Join button */}
        {isOnline && meeting.meetingLink && meeting.status === 'SCHEDULED' && (
          <div style={{ marginTop: '20px' }}>
            <a href={meeting.meetingLink} target="_blank" rel="noreferrer"
              className="btn btn-primary">
              <Video size={16} /> Join Meeting
            </a>
          </div>
        )}
      </div>

      {/* RSVP for participants */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 className="card-title">Your Response</h2>
        <div className="flex gap-3">
          {[['ACCEPTED', '✅ Accept', 'btn-success'], ['DECLINED', '❌ Decline', 'btn-danger'],
            ['TENTATIVE', '❓ Maybe', 'btn-secondary']].map(([status, label, cls]) => (
            <button key={status} className={`btn ${cls} btn-sm`}
              disabled={responding} onClick={() => handleRespond(status)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Participants */}
      <div className="card">
        <h2 className="card-title">
          Participants ({meeting.participants?.length || 0})
        </h2>
        {!meeting.participants?.length ? (
          <p className="text-muted text-sm">No participants added</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {meeting.participants.map(p => (
              <div key={p.id} className="flex items-center gap-3"
                style={{ padding: '10px', border: '1px solid var(--border)',
                  borderRadius: '8px', justifyContent: 'space-between' }}>
                <div className="flex items-center gap-3">
                  <div className="avatar" style={{ background: getAvatarColor(p.email) }}>
                    {getInitials(p.name || p.email)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.name || p.email}</div>
                    {p.name && <div className="text-xs text-muted">{p.email}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {RESPONSE_ICONS[p.responseStatus]}
                  <span className={`badge badge-${p.responseStatus?.toLowerCase()}`}>
                    {p.responseStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}
