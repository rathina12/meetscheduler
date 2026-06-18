import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';

export const formatTime = (dt) => {
  if (!dt) return '';
  const d = typeof dt === 'string' ? parseISO(dt) : dt;
  return format(d, 'hh:mm a');
};

export const formatDate = (dt) => {
  if (!dt) return '';
  const d = typeof dt === 'string' ? parseISO(dt) : dt;
  return format(d, 'MMM dd, yyyy');
};

export const formatDateTime = (dt) => {
  if (!dt) return '';
  const d = typeof dt === 'string' ? parseISO(dt) : dt;
  return format(d, 'MMM dd, yyyy hh:mm a');
};

export const formatRelative = (dt) => {
  if (!dt) return '';
  const d = typeof dt === 'string' ? parseISO(dt) : dt;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const getDayLabel = (dt) => {
  const d = typeof dt === 'string' ? parseISO(dt) : dt;
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, MMM dd');
};

export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export const getAvatarColor = (name = '') => {
  const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const getMeetingStatusClass = (status) => {
  const map = {
    SCHEDULED: 'badge-scheduled',
    CANCELLED: 'badge-cancelled',
    COMPLETED: 'badge-completed',
    RESCHEDULED: 'badge-rescheduled',
  };
  return map[status] || 'badge-scheduled';
};

export const getMeetingTypeClass = (type) =>
  type === 'ONLINE' ? 'badge-online' : 'badge-offline';

export const toISOLocalString = (date, time) => {
  if (!date) return '';
  return `${date}T${time || '00:00'}:00`;
};

export const durationMinutes = (start, end) => {
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : end;
  return Math.round((e - s) / 60000);
};
