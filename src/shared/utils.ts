export const TIMEZONE = 'America/Lima';
export const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export const dateKey = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
export const timeLabel = (iso: string) =>
  new Intl.DateTimeFormat('es-PE', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
export const dateLabel = (iso: string, long = false) =>
  new Intl.DateTimeFormat('es-PE', {
    timeZone: TIMEZONE,
    ...(long
      ? ({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } as const)
      : ({ day: '2-digit', month: 'short', year: 'numeric' } as const)),
  }).format(new Date(iso.length === 10 ? iso + 'T12:00:00-05:00' : iso));
export const toISO = (date: string, time: string) =>
  new Date(`${date}T${time}:00-05:00`).toISOString();
export function addDays(date: string, days: number) {
  const value = new Date(date + 'T12:00:00-05:00');
  value.setUTCDate(value.getUTCDate() + days);
  return dateKey(value.toISOString());
}
export const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');
export const services = ['Consulta general', 'Control médico', 'Primera visita', 'Seguimiento'];
export const statusConfig = {
  pending: { label: 'Pendiente', tone: 'warning' },
  confirmed: { label: 'Confirmada', tone: 'success' },
  cancelled: { label: 'Cancelada', tone: 'danger' },
  rescheduled: { label: 'Reprogramada', tone: 'info' },
  new: { label: 'Nuevo', tone: 'warning' },
  contacted: { label: 'Contactado', tone: 'info' },
  converted: { label: 'Convertido', tone: 'success' },
  inactive: { label: 'Inactivo', tone: 'muted' },
} as const;
