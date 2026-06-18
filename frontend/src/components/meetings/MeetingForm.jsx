import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Users, Video, MapPin, Calendar, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

const MEETING_TYPES = ['ONLINE', 'OFFLINE'];
const RECURRENCE = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

export default function MeetingForm({ existing, onSaved }) {
  const navigate = useNavigate();
  const isEdit = !!existing;

  const toDateInput = (dt) => dt ? dt.split('T')[0] : '';
  const toTimeInput = (dt) => dt ? dt.split('T')[1]?.slice(0, 5) : '';

  const [form, setForm] = useState({
    title: existing?.title || '',
    description: existing?.description || '',
    startDate: toDateInput(existing?.startTime) || new Date().toISOString().split('T')[0],
    startTime: toTimeInput(existing?.startTime) || '09:00',
    endDate: toDateInput(existing?.endTime) || new Date().toISOString().split('T')[0],
    endTime: toTimeInput(existing?.endTime) || '10:00',
    location: existing?.location || '',
    meetingType: existing?.meetingType || 'ONLINE',
    meetingLink: existing?.meetingLink || '',
    participantEmails: existing?.participants?.map(p => p.email) || [],
    isRecurring: existing?.isRecurring || false,
    recurrencePattern: existing?.recurrencePattern || 'WEEKLY',
    recurrenceEndDate: existing?.recurrenceEndDate || '',
  });
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [conflictWarning, setConflictWarning] = useState(null);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' }));
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Invalid email address' }));
      return;
    }
    if (form.participantEmails.includes(email)) {
      setErrors(prev => ({ ...prev, email: 'Already added' }));
      return;
    }
    setForm(f => ({ ...f, participantEmails: [...f.participantEmails, email] }));
    setEmailInput('');
    setErrors(prev => ({ ...prev, email: '' }));
  };

  const removeEmail = (email) =>
    setForm(f => ({ ...f, participantEmails: f.participantEmails.filter(e => e !== email) }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Meeting title is required';
    if (!form.startDate) e.startDate = 'Start date is required';
    if (!form.endDate) e.endDate = 'End date is required';
    const start = new Date(`${form.startDate}T${form.startTime}`);
    const end = new Date(`${form.endDate}T${form.endTime}`);
    if (end <= start) e.endTime = 'End time must be after start time';
    if (form.isRecurring && !form.recurrenceEndDate) e.recurrenceEndDate = 'Recurrence end date required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => ({
    title: form.title,
    description: form.description,
    startTime: `${form.startDate}T${form.startTime}:00`,
    endTime: `${form.endDate}T${form.endTime}:00`,
    location: form.location,
    meetingType: form.meetingType,
    meetingLink: form.meetingLink,
    participantEmails: form.participantEmails,
    isRecurring: form.isRecurring,
    recurrencePattern: form.isRecurring ? form.recurrencePattern : null,
    recurrenceEndDate: form.isRecurring ? form.recurrenceEndDate : null,
  });

  const handleSubmit = async (e, forceCreate = false) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setConflictWarning(null);
    try {
      if (isEdit) {
        await meetingsAPI.update(existing.id, buildPayload());
        toast.success('Meeting updated successfully');
        onSaved ? onSaved() : navigate('/meetings');
      } else {
        await meetingsAPI.create(buildPayload(), forceCreate);
        toast.success('Meeting created successfully');
        navigate('/meetings');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.conflict) {
        // Show warning but allow user to proceed
        setConflictWarning(data.message);
        toast('⚠️ Time conflict detected — you can still create the meeting', {
          icon: '⚠️', duration: 5000,
          style: { background: '#fef3c7', color: '#92400e' }
        });
      } else {
        toast.error(data?.message || 'Failed to save meeting');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {isEdit ? 'Edit Meeting' : 'Schedule New Meeting'}
          </h1>
          <p className="text-muted text-sm">Fill in the details below</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <X size={16} /> Cancel
        </button>
      </div>

      <div style={{ maxWidth: '720px' }}>
        {/* Conflict Warning Banner */}
        {conflictWarning && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px',
            padding: '16px 20px', marginBottom: '20px', display: 'flex',
            alignItems: 'flex-start', gap: '12px' }}>
            <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                Time Conflict Detected
              </p>
              <p style={{ color: '#92400e', fontSize: '0.875rem', marginBottom: '12px' }}>
                {conflictWarning}. You can still create this meeting if needed.
              </p>
              <div className="flex gap-2">
                <button className="btn btn-sm"
                  style={{ background: '#d97706', color: '#fff', border: 'none' }}
                  onClick={() => handleSubmit(null, true)}
                  disabled={loading}>
                  Create Anyway
                </button>
                <button className="btn btn-secondary btn-sm"
                  onClick={() => setConflictWarning(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} /> Basic Information
            </h3>
            <div className="form-group">
              <label className="form-label">Meeting Title *</label>
              <input className="form-input" placeholder="e.g. Weekly Team Standup"
                value={form.title} onChange={set('title')} />
              {errors.title && <p className="form-error">{errors.title}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={3}
                placeholder="Agenda, objectives, notes..."
                value={form.description} onChange={set('description')} />
            </div>
          </div>

          {/* Date & Time */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} /> Date & Time
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input type="date" className="form-input" value={form.startDate} onChange={set('startDate')} />
                {errors.startDate && <p className="form-error">{errors.startDate}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input type="time" className="form-input" value={form.startTime} onChange={set('startTime')} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input type="date" className="form-input" value={form.endDate} onChange={set('endDate')} />
                {errors.endDate && <p className="form-error">{errors.endDate}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input type="time" className="form-input" value={form.endTime} onChange={set('endTime')} />
                {errors.endTime && <p className="form-error">{errors.endTime}</p>}
              </div>
            </div>

            {/* Recurring */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isRecurring} onChange={set('isRecurring')} />
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                  <RefreshCw size={16} /> Recurring Meeting
                </span>
              </label>
              {form.isRecurring && (
                <div className="form-row" style={{ marginTop: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Pattern</label>
                    <select className="form-select" value={form.recurrencePattern} onChange={set('recurrencePattern')}>
                      {RECURRENCE.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input type="date" className="form-input" value={form.recurrenceEndDate} onChange={set('recurrenceEndDate')} />
                    {errors.recurrenceEndDate && <p className="form-error">{errors.recurrenceEndDate}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} /> Location & Type
            </h3>
            <div className="form-group">
              <label className="form-label">Meeting Type</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {MEETING_TYPES.map(t => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px',
                    cursor: 'pointer', padding: '10px 16px', border: '2px solid',
                    borderColor: form.meetingType === t ? 'var(--primary)' : 'var(--border)',
                    borderRadius: '8px', background: form.meetingType === t ? 'var(--primary-light)' : 'transparent',
                    flex: 1, justifyContent: 'center', transition: 'all 0.15s' }}>
                    <input type="radio" name="meetingType" value={t}
                      checked={form.meetingType === t} onChange={set('meetingType')} style={{ display: 'none' }} />
                    {t === 'ONLINE' ? <Video size={16} /> : <MapPin size={16} />}
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">
                {form.meetingType === 'ONLINE' ? 'Meeting Link (optional)' : 'Venue / Location'}
              </label>
              <input className="form-input"
                placeholder={form.meetingType === 'ONLINE'
                  ? 'https://meet.google.com/...' : 'Office Room 301'}
                value={form.meetingType === 'ONLINE' ? form.meetingLink : form.location}
                onChange={set(form.meetingType === 'ONLINE' ? 'meetingLink' : 'location')} />
            </div>
          </div>

          {/* Participants */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} /> Participants
              {form.participantEmails.length > 0 && (
                <span className="badge badge-scheduled">{form.participantEmails.length}</span>
              )}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="form-input" type="email" placeholder="participant@example.com"
                value={emailInput}
                onChange={e => { setEmailInput(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                style={{ flex: 1 }} />
              <button type="button" className="btn btn-secondary" onClick={addEmail}>
                <Plus size={16} /> Add
              </button>
            </div>
            {errors.email && <p className="form-error">{errors.email}</p>}
            {form.participantEmails.length > 0 && (
              <div className="chip-list" style={{ marginTop: '12px' }}>
                {form.participantEmails.map(email => (
                  <div key={email} className="chip">
                    {email}
                    <button type="button" className="chip-remove" onClick={() => removeEmail(email)}>×</button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted" style={{ marginTop: '8px' }}>
              Registered users will receive in-app notifications. All participants get email invitations.
            </p>
          </div>

          <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? '💾 Update Meeting' : '📅 Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
