import type { Appointment, Settings } from '../shared/types';
import { dateKey, timeLabel, toISO } from '../shared/utils';
export function validateSlot(
  startsAt: string,
  appointments: Appointment[],
  settings: Settings,
  leadId: string,
  excludeId?: string,
  clock = Date.now(),
): string | null {
  const date = new Date(startsAt);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= clock) return 'PAST_DATE';
  const time = timeLabel(startsAt);
  const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  const start = minutes(time),
    open = minutes(settings.opensAt),
    close = minutes(settings.closesAt);
  if (
    start < open ||
    start + settings.slotMinutes > close ||
    (start - open) % settings.slotMinutes !== 0
  )
    return 'INVALID_TIME_SLOT';
  const collision = appointments.find(
    (a) =>
      a.id !== excludeId &&
      a.status !== 'cancelled' &&
      Math.abs(new Date(a.startsAt).getTime() - date.getTime()) < settings.slotMinutes * 60000,
  );
  if (collision) return collision.leadId === leadId ? 'DUPLICATE_APPOINTMENT' : 'SLOT_UNAVAILABLE';
  return null;
}
export function availableSlots(
  date: string,
  appointments: Appointment[],
  settings: Settings,
  excludeId?: string,
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const slots: string[] = [];
  const open = Number(settings.opensAt.slice(0, 2)) * 60 + Number(settings.opensAt.slice(3));
  const close = Number(settings.closesAt.slice(0, 2)) * 60 + Number(settings.closesAt.slice(3));
  for (let n = open; n + settings.slotMinutes <= close; n += settings.slotMinutes) {
    const time = `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
    if (!validateSlot(toISO(date, time), appointments, settings, '', excludeId)) slots.push(time);
  }
  return slots;
}
export const slotErrors: Record<string, string> = {
  PAST_DATE: 'Elige una fecha y hora futuras.',
  INVALID_TIME_SLOT: 'El horario está fuera de atención o no coincide con un turno disponible.',
  DUPLICATE_APPOINTMENT: 'El paciente ya tiene una cita en ese horario.',
  SLOT_UNAVAILABLE: 'Ese horario acaba de ocuparse. Selecciona otro para continuar.',
};
export const matchesDay = (a: Appointment, date: string) => dateKey(a.startsAt) === date;
