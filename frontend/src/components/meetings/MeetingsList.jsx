import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingsAPI } from '../../services/api';
import { formatDateTime } from '../../utils/helpers';
import { Plus, Search, Video, MapPin, Users, Calendar, Trash2, Edit, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const FILTERS = ['ALL', 'SCHEDULED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED'];

const STATUS_BADGE = {
  SCHEDULED:   { label: 'Scheduled',  cls: 'badge-scheduled' },
  RESCHEDULED: { label: 'Updated',    cls: 'badge-rescheduled' },  // show "Updated" not "Rescheduled"
  CANCELLED:   { label: 'Cancelled',  cls: 'badge-cancelled' },
  COMPLETED:   { label: 'Completed',  cls: 'badge-completed' },
};

export default function MeetingsList() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadMeetings(); }, []);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const { data } = await meetingsAPI.getAll();
      setMeetings(data.data || []);
    } catch {}
    setLoading(false);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this meeting? Participants will be notified.')) return;
    try {
      await meetingsAPI.cancel(id);
      toast.success('Meeting cancelled');
      loadMeetings();
    } catch {}
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await meetingsAPI.delete(id);
      toast.success('Meeting deleted');
      setDeleteConfirm(null);
      loadMeetings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete meeting');
    }
    setDeleting(false);
  };

  const filtered = meetings.filter(m => {
    const matchSearch = m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.organizer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Meetings</h1>
          <p className="text-muted text-sm">{meetings.length} total meetings</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/meetings/new')}>
          <Plus size={16} /> New Meeting
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div className="flex gap-3" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" placeholder="Search meetings..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }} />
          </div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f}
                className={`btn btn-sm ${statusFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(f)}>
                {f === 'RESCHEDULED' ? 'UPDATED' : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="loading-spinner" />
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
          <h3 style={{ marginBottom: '8px' }}>No meetings found</h3>
          <p className="text-muted text-sm">
            {search ? 'Try a different search term' : 'Schedule your first meeting to get started'}
          </p>
          {!search && (
            <button className="btn btn-primary" style={{ marginTop: '16px' }}
              onClick={() => navigate('/meetings/new')}>
              Schedule Meeting
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(meeting => (
            <MeetingCard key={meeting.id} meeting={meeting}
              onView={() => navigate(`/meetings/${meeting.id}`)}
              onEdit={() => navigate(`/meetings/${meeting.id}/edit`)}
              onCancel={() => handleCancel(meeting.id)}
              onDelete={() => setDeleteConfirm(meeting.id)} />
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Meeting</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to permanently delete this meeting?</p>
              <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                This will also remove all notifications related to this meeting.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}
                disabled={deleting}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting, onView, onEdit, onCancel, onDelete }) {
  const badge = STATUS_BADGE[meeting.status] || STATUS_BADGE.SCHEDULED;
  const typeBadge = meeting.meetingType === 'ONLINE'
    ? { label: 'Online', cls: 'badge-online' }
    : { label: 'Offline', cls: 'badge-offline' };

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div className="flex justify-between items-start">
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onView}>
          <div className="flex gap-2 items-center" style={{ marginBottom: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>{meeting.title}</h3>
            <span className={`badge ${badge.cls}`}>{badge.label}</span>
            <span className={`badge ${typeBadge.cls}`}>{typeBadge.label}</span>
            {meeting.isRecurring && (
              <span className="badge" style={{ background: '#f3e8ff', color: '#7e22ce' }}>🔄 Recurring</span>
            )}
          </div>

          {meeting.description && (
            <p className="text-sm text-muted" style={{ marginBottom: '10px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {meeting.description}
            </p>
          )}

          <div className="meeting-meta">
            <span><Calendar size={14} /> {formatDateTime(meeting.startTime)}</span>
            <span style={{ color: 'var(--text-muted)' }}>→ {formatDateTime(meeting.endTime)}</span>
            {meeting.meetingType === 'ONLINE' && meeting.meetingLink
              ? <span><Video size={14} /> Online</span>
              : meeting.location && <span><MapPin size={14} /> {meeting.location}</span>}
            {meeting.participants?.length > 0 && (
              <span><Users size={14} /> {meeting.participants.length} participants</span>
            )}
          </div>
        </div>

        <div className="flex gap-2" style={{ marginLeft: '16px', flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={onView}>View</button>
          {(meeting.status === 'SCHEDULED' || meeting.status === 'RESCHEDULED') && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={onEdit} title="Edit">
                <Edit size={14} />
              </button>
              <button className="btn btn-sm" onClick={onCancel}
                style={{ background: '#fef3c7', color: '#d97706', border: 'none' }}
                title="Cancel meeting">
                <XCircle size={14} />
              </button>
            </>
          )}
          <button className="btn btn-danger btn-sm" onClick={onDelete} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
