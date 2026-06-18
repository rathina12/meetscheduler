import { useState, useEffect } from 'react';
import { meetingsAPI } from '../../services/api';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VIEWS = ['Month', 'Week', 'Day'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView() {
  const navigate = useNavigate();
  const [view, setView] = useState('Month');
  const [current, setCurrent] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadMeetings();
  }, [current, view]);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      let start, end;
      if (view === 'Month') {
        start = startOfWeek(startOfMonth(current));
        end = endOfWeek(endOfMonth(current));
      } else if (view === 'Week') {
        start = startOfWeek(current);
        end = endOfWeek(current);
      } else {
        start = new Date(current);
        start.setHours(0, 0, 0, 0);
        end = new Date(current);
        end.setHours(23, 59, 59, 999);
      }
      const { data } = await meetingsAPI.getByRange(start.toISOString(), end.toISOString());
      setMeetings(data.data || []);
    } catch {}
    setLoading(false);
  };

  const navigate_ = (dir) => {
    if (view === 'Month') setCurrent(dir > 0 ? addMonths(current, 1) : subMonths(current, 1));
    else if (view === 'Week') setCurrent(dir > 0 ? addWeeks(current, 1) : subWeeks(current, 1));
    else setCurrent(addDays(current, dir));
  };

  const getMeetingsForDay = (day) =>
    meetings.filter(m => isSameDay(parseISO(m.startTime), day));

  const statusColor = (status) => {
    if (status === 'CANCELLED') return '#ef4444';
    if (status === 'COMPLETED') return '#10b981';
    return '#4f46e5';
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Calendar</h1>
          <p className="text-muted text-sm">Manage and view your schedule</p>
        </div>
        <div className="flex gap-2">
          <div className="tabs" style={{ border: 'none', gap: '4px', marginBottom: 0 }}>
            {VIEWS.map(v => (
              <button key={v} className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setView(v)}>
                {v}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/meetings/new')}>
            + New
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="card" style={{ marginBottom: '16px', padding: '14px 20px' }}>
        <div className="flex justify-between items-center">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate_(-1)}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {view === 'Month' && format(current, 'MMMM yyyy')}
              {view === 'Week' && `${format(startOfWeek(current), 'MMM dd')} – ${format(endOfWeek(current), 'MMM dd, yyyy')}`}
              {view === 'Day' && format(current, 'EEEE, MMMM dd, yyyy')}
            </span>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrent(new Date())}>
              Today
            </button>
            <button className="btn btn-ghost btn-icon" onClick={() => navigate_(1)}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === 'Month' && <MonthView current={current} getMeetings={getMeetingsForDay}
        onDayClick={setSelected} selected={selected} statusColor={statusColor}
        onMeetingClick={id => navigate(`/meetings/${id}`)} />}

      {view === 'Week' && <WeekView current={current} meetings={meetings} statusColor={statusColor}
        onMeetingClick={id => navigate(`/meetings/${id}`)} />}

      {view === 'Day' && <DayView current={current} meetings={getMeetingsForDay(current)}
        statusColor={statusColor} onMeetingClick={id => navigate(`/meetings/${id}`)} />}
    </div>
  );
}

function MonthView({ current, getMeetings, onDayClick, selected, statusColor, onMeetingClick }) {
  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  return (
    <div className="calendar-grid">
      {DAY_LABELS.map(l => (
        <div key={l} className="calendar-day-header">{l}</div>
      ))}
      {days.map(d => {
        const dayMeetings = getMeetings(d);
        const isCurrentMonth = isSameMonth(d, current);
        const isSelected = selected && isSameDay(d, selected);
        return (
          <div key={d.toString()}
            className={`calendar-day ${isToday(d) ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => onDayClick(d)}>
            <div className="day-number">{format(d, 'd')}</div>
            {dayMeetings.slice(0, 3).map(m => (
              <div key={m.id} className="cal-event"
                style={{ background: statusColor(m.status) }}
                onClick={e => { e.stopPropagation(); onMeetingClick(m.id); }}
                title={m.title}>
                {format(parseISO(m.startTime), 'HH:mm')} {m.title}
              </div>
            ))}
            {dayMeetings.length > 3 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '1px 4px' }}>
                +{dayMeetings.length - 3} more
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WeekView({ current, meetings, statusColor, onMeetingClick }) {
  const weekStart = startOfWeek(current);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getMeetingsForHour = (day, hour) =>
    meetings.filter(m => {
      const start = parseISO(m.startTime);
      return isSameDay(start, day) && start.getHours() === hour;
    });

  return (
    <div className="card" style={{ padding: 0, overflow: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', minWidth: '700px' }}>
        {/* Header row */}
        <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '12px' }} />
        {days.map(d => (
          <div key={d.toString()}
            className={`week-day-header ${isToday(d) ? 'today' : ''}`}
            style={{ padding: '12px 8px', textAlign: 'center', background: 'var(--bg-card)',
              borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase',
              color: isToday(d) ? 'var(--primary)' : 'var(--text-muted)' }}>
              {format(d, 'EEE')}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: isToday(d) ? 700 : 400,
              color: isToday(d) ? 'var(--primary)' : 'var(--text)' }}>
              {format(d, 'd')}
            </div>
          </div>
        ))}

        {/* Hour rows */}
        {hours.map(hour => (
          <>
            <div key={`h-${hour}`} className="week-hour-slot">
              {hour === 0 ? '' : `${hour.toString().padStart(2, '0')}:00`}
            </div>
            {days.map(d => {
              const dayHourMeetings = getMeetingsForHour(d, hour);
              return (
                <div key={`${d}-${hour}`}
                  style={{ borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                    minHeight: '60px', padding: '4px', background: 'var(--bg-card)', position: 'relative' }}>
                  {dayHourMeetings.map(m => (
                    <div key={m.id}
                      onClick={() => onMeetingClick(m.id)}
                      style={{ background: statusColor(m.status), color: '#fff',
                        borderRadius: '4px', padding: '2px 6px', fontSize: '0.72rem',
                        marginBottom: '2px', cursor: 'pointer',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

function DayView({ current, meetings, statusColor, onMeetingClick }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getMeetingsForHour = (hour) =>
    meetings.filter(m => parseISO(m.startTime).getHours() === hour);

  return (
    <div className="card" style={{ padding: 0 }}>
      {hours.map(hour => {
        const hourMeetings = getMeetingsForHour(hour);
        return (
          <div key={hour} style={{ display: 'flex', borderBottom: '1px solid var(--border)', minHeight: '60px' }}>
            <div style={{ width: '70px', padding: '8px', fontSize: '0.75rem',
              color: 'var(--text-muted)', borderRight: '1px solid var(--border)',
              flexShrink: 0 }}>
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
            <div style={{ flex: 1, padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {hourMeetings.map(m => (
                <div key={m.id} onClick={() => onMeetingClick(m.id)}
                  style={{ background: statusColor(m.status), color: '#fff',
                    borderRadius: '6px', padding: '6px 12px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.title}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                      {format(parseISO(m.startTime), 'hh:mm a')} – {format(parseISO(m.endTime), 'hh:mm a')}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '99px' }}>
                    {m.meetingType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
