import { useState } from 'react';
import { meetingsAPI } from '../../services/api';
import { CalendarDays, Download, ShieldCheck, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const escapeIcs = value => String(value || '')
  .replace(/\\/g, '\\\\')
  .replace(/\r?\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

const toIcsDate = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

function buildCalendar(meetings) {
  const now = toIcsDate(new Date());
  const events = meetings.filter(m => m.status !== 'CANCELLED').flatMap(m => {
    const start = toIcsDate(m.startTime);
    const end = toIcsDate(m.endTime);
    if (!start || !end || !m.id) return [];
    return [
      'BEGIN:VEVENT',
      'UID:meetscheduler-' + m.id + '@local',
      'DTSTAMP:' + now,
      'DTSTART:' + start,
      'DTEND:' + end,
      'SUMMARY:' + escapeIcs(m.title),
      'DESCRIPTION:' + escapeIcs(m.description),
      'LOCATION:' + escapeIcs(m.location || m.meetingLink),
      'END:VEVENT'
    ];
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MeetScheduler//EN',
    'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR', ''].join('\r\n');
}

export default function CalendarSync() {
  const [exporting, setExporting] = useState(false);

  const exportCalendar = async () => {
    setExporting(true);
    try {
      const { data } = await meetingsAPI.getAll();
      const meetings = Array.isArray(data.data) ? data.data : [];
      const blob = new Blob([buildCalendar(meetings)], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'meetscheduler-calendar.ics';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success('Calendar exported — ' + meetings.filter(m => m.status !== 'CANCELLED').length + ' meetings available');
    } catch {
      toast.error('Could not export meetings. Try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <section className="ms-hero">
        <span className="ms-kicker">Calendar toolkit</span>
        <h1>Take your schedule anywhere.</h1>
        <p>Export your meetings to a standard calendar file, without connecting an external account.</p>
      </section>
      <div className="card" style={{ maxWidth: 720, marginBottom: 20 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
          <CalendarDays size={30} color="var(--primary)" />
          <div>
            <h2 className="card-title" style={{ margin: 0 }}>Export calendar (.ics)</h2>
            <p className="text-muted text-sm">Compatible with Google Calendar, Outlook and Apple Calendar.</p>
          </div>
        </div>
        <p className="text-muted text-sm" style={{ marginBottom: 20 }}>
          Includes your accessible non-cancelled meetings. Import the downloaded file in your calendar app.
          This is a one-time export, not automatic synchronization.
        </p>
        <button className="btn btn-primary" onClick={exportCalendar} disabled={exporting}>
          <Download size={17} /> {exporting ? 'Preparing export...' : 'Download calendar'}
        </button>
      </div>
      <div className="card" style={{ maxWidth: 720 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
          <ShieldCheck size={22} color="var(--success)" />
          <h2 className="card-title" style={{ margin: 0 }}>Clear integration status</h2>
        </div>
        <p className="text-muted text-sm">
          <Info size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Live Google and Microsoft two-way synchronization is not available in this version.
          We will not ask for OAuth permission or report a successful sync until the integration is fully implemented and tested.
        </p>
      </div>
    </div>
  );
}
