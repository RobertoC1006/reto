import { describe, expect, it } from 'vitest';
import { validateSlot } from '../src/mocks/rules';
import type { Appointment, Settings } from '../src/shared/types';
const settings: Settings = {
  clinicName: 'Praxia',
  phone: '',
  address: '',
  opensAt: '08:00',
  closesAt: '18:00',
  slotMinutes: 30,
  timezone: 'America/Lima',
};
const at = (time: string) => `2030-10-10T${time}:00-05:00`;
const clock = new Date('2030-10-09T12:00:00Z').getTime();
const appointment: Appointment = {
  id: 'a',
  leadId: 'p',
  startsAt: at('10:00'),
  status: 'confirmed',
  service: 'Consulta general',
  notes: '',
  history: [],
};
describe('Disponibilidad y conflictos', () => {
  it('admite el límite inicial y rechaza un turno que termina fuera de atención', () => {
    expect(validateSlot(at('08:00'), [], settings, 'p', undefined, clock)).toBeNull();
    expect(validateSlot(at('18:00'), [], settings, 'p', undefined, clock)).toBe(
      'INVALID_TIME_SLOT',
    );
  });
  it('distingue una reserva duplicada de un horario ocupado por otra persona', () => {
    expect(validateSlot(at('10:00'), [appointment], settings, 'p', undefined, clock)).toBe(
      'DUPLICATE_APPOINTMENT',
    );
    expect(validateSlot(at('10:00'), [appointment], settings, 'other', undefined, clock)).toBe(
      'SLOT_UNAVAILABLE',
    );
  });
  it('libera las citas canceladas y excluye la cita editada', () => {
    expect(
      validateSlot(
        at('10:00'),
        [{ ...appointment, status: 'cancelled' }],
        settings,
        'p',
        undefined,
        clock,
      ),
    ).toBeNull();
    expect(validateSlot(at('10:00'), [appointment], settings, 'p', 'a', clock)).toBeNull();
  });
  it('rechaza fechas pasadas y horarios que no coinciden con un turno', () => {
    expect(validateSlot('2020-01-01T10:00:00-05:00', [], settings, 'p', undefined, clock)).toBe(
      'PAST_DATE',
    );
    expect(validateSlot(at('09:15'), [], settings, 'p', undefined, clock)).toBe(
      'INVALID_TIME_SLOT',
    );
  });
});
