import { useState } from 'react';
import { Link } from 'react-router';
import { Check, CalendarClock, X, Send } from 'lucide-react';
import { api } from '../../shared/api/services';
import type { Appointment } from '../../shared/types';
import { Alert, Button, ConfirmDialog, useToast } from '../../shared/components/ui';
import { useRefresh } from '../../shared/hooks';
export default function AppointmentActions({ appointment }: { appointment: Appointment }) {
  const [cancel, setCancel] = useState(false),
    [busy, setBusy] = useState(''),
    [error, setError] = useState('');
  const refresh = useRefresh(),
    toast = useToast();
  const act = async (action: 'confirmed' | 'cancelled' | 'reminder') => {
    setBusy(action);
    setError('');
    try {
      if (action === 'reminder') await api.reminder(appointment.id);
      else await api.status(appointment.id, action);
      await refresh();
      toast(
        action === 'reminder'
          ? 'Recordatorio agregado a WhatsApp'
          : action === 'confirmed'
            ? 'Cita confirmada'
            : 'Cita cancelada',
      );
      setCancel(false);
    } catch (err) {
      setError((err as Error).message);
      setCancel(false);
    } finally {
      setBusy('');
    }
  };
  return (
    <>
      <div className="appointment-actions">
        {appointment.status !== 'cancelled' && (
          <>
            {appointment.status !== 'confirmed' && (
              <Button
                variant="teal"
                disabled={!!busy}
                loading={busy === 'confirmed'}
                onClick={() => act('confirmed')}
              >
                <Check size={16} /> Confirmar cita
              </Button>
            )}
            <Link className="btn btn-secondary" to={`/app/citas/${appointment.id}/editar`}>
              <CalendarClock size={16} /> Reprogramar
            </Link>
            <Button
              variant="secondary"
              disabled={!!busy}
              loading={busy === 'reminder'}
              onClick={() => act('reminder')}
            >
              <Send size={16} /> Enviar recordatorio
            </Button>
            <Button variant="danger" disabled={!!busy} onClick={() => setCancel(true)}>
              <X size={16} /> Cancelar cita
            </Button>
          </>
        )}
        {appointment.status === 'cancelled' && (
          <p className="muted">Esta cita fue cancelada. Puedes crear una nueva reserva.</p>
        )}
      </div>
      {error && <Alert>{error}</Alert>}
      <ConfirmDialog
        open={cancel}
        onClose={() => setCancel(false)}
        onConfirm={() => act('cancelled')}
        loading={busy === 'cancelled'}
        title="¿Cancelar esta cita?"
        message="El horario quedará disponible para otro paciente. Conservaremos el registro en el historial."
      />
    </>
  );
}
