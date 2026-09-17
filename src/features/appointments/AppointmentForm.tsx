import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { CalendarDays, Check, Plus } from 'lucide-react';
import { api } from '../../shared/api/services';
import { ApiError } from '../../shared/api/client';
import { useLeadDirectory, useRefresh } from '../../shared/hooks';
import { addDays, dateKey, services, timeLabel, today, toISO } from '../../shared/utils';
import {
  Alert,
  Button,
  Card,
  ErrorState,
  Field,
  Modal,
  PageHeader,
  Skeleton,
  useToast,
} from '../../shared/components/ui';
import LeadForm from '../leads/LeadForm';
const schema = z.object({
  leadId: z.string().min(1, 'Selecciona un paciente.'),
  date: z.string().min(1, 'Selecciona una fecha.'),
  time: z.string().min(1, 'Selecciona un horario.'),
  service: z.string().min(1, 'Selecciona el motivo.'),
  notes: z.string().max(500, 'Máximo 500 caracteres.'),
  status: z.enum(['pending', 'confirmed', 'rescheduled']),
});
type Values = z.infer<typeof schema>;
export default function AppointmentForm() {
  const { appointmentId } = useParams(),
    [params] = useSearchParams(),
    navigate = useNavigate(),
    refresh = useRefresh(),
    toast = useToast();
  const [error, setError] = useState(''),
    [newLead, setNewLead] = useState(false);
  const directory = useLeadDirectory();
  const existing = useQuery({
    queryKey: ['appointments', appointmentId],
    queryFn: () => api.appointment(appointmentId!),
    enabled: !!appointmentId,
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      leadId: params.get('leadId') || '',
      date: addDays(today(), 1),
      time: '',
      service: services[0],
      status: 'pending',
      notes: '',
    },
  });
  useEffect(() => {
    if (existing.data)
      reset({
        leadId: existing.data.leadId,
        date: dateKey(existing.data.startsAt),
        time: timeLabel(existing.data.startsAt),
        service: existing.data.service,
        notes: existing.data.notes,
        status: existing.data.status === 'cancelled' ? 'pending' : existing.data.status,
      });
  }, [existing.data, reset]);
  const date = watch('date'),
    time = watch('time');
  const slots = useQuery({
    queryKey: ['availability', date, appointmentId],
    queryFn: () => api.availability(date, appointmentId),
    enabled: !!date,
  });
  if (appointmentId && existing.isPending) return <Skeleton />;
  if (existing.error) return <ErrorState error={existing.error} retry={() => existing.refetch()} />;
  return (
    <>
      <PageHeader
        title={appointmentId ? 'Editar / reprogramar cita' : 'Crear cita'}
        subtitle="Organiza una nueva oportunidad para cuidar."
        back={appointmentId ? `/app/citas/${appointmentId}` : '/app/citas'}
      />
      <div className="appointment-form-layout">
        <Card className="form-card">
          <form
            onSubmit={handleSubmit(async (values) => {
              setError('');
              try {
                const saved = await api.saveAppointment(
                  {
                    leadId: values.leadId,
                    startsAt: toISO(values.date, values.time),
                    service: values.service,
                    notes: values.notes,
                    status: values.status,
                  },
                  appointmentId,
                );
                await refresh();
                toast(appointmentId ? 'Cita actualizada' : 'Cita creada correctamente');
                navigate(`/app/citas/${saved.id}`);
              } catch (err) {
                setError((err as Error).message);
                if (err instanceof ApiError && err.fieldErrors)
                  Object.entries(err.fieldErrors).forEach(([key, message]) =>
                    setFieldError(key as keyof Values, { message }),
                  );
                void slots.refetch();
              }
            })}
          >
            <div className="form-section-title">
              <CalendarDays size={21} />
              <div>
                <h2>Información de la cita</h2>
                <p>Los campos con * son obligatorios.</p>
              </div>
            </div>
            <Field
              label="Paciente / Lead"
              htmlFor="appointment-lead"
              required
              error={errors.leadId?.message}
            >
              <select id="appointment-lead" {...register('leadId')}>
                <option value="">Selecciona un paciente</option>
                {directory.data?.items.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.phone})
                  </option>
                ))}
              </select>
            </Field>
            {directory.error && (
              <ErrorState error={directory.error} retry={() => directory.refetch()} />
            )}
            <button
              className="text-button add-inline"
              type="button"
              onClick={() => setNewLead(true)}
            >
              <Plus size={14} /> Registrar un nuevo paciente
            </button>
            <div className="form-grid">
              <Field label="Fecha" htmlFor="appointment-date" required error={errors.date?.message}>
                <input
                  id="appointment-date"
                  type="date"
                  min={today()}
                  {...register('date', { onChange: () => setValue('time', '') })}
                />
              </Field>
              <Field label="Hora" htmlFor="appointment-time" required error={errors.time?.message}>
                <input id="appointment-time" type="time" {...register('time')} />
              </Field>
            </div>
            <div className="availability">
              <strong>Horarios disponibles</strong>
              {slots.isPending ? (
                <span>Consultando disponibilidad…</span>
              ) : slots.error ? (
                <ErrorState error={slots.error} retry={() => slots.refetch()} />
              ) : !slots.data?.length ? (
                <p>No hay turnos para este día. Selecciona otra fecha.</p>
              ) : (
                <div className="slot-grid">
                  {slots.data.map((t) => (
                    <button
                      type="button"
                      key={t}
                      aria-pressed={time === t}
                      className={time === t ? 'selected' : ''}
                      onClick={() => {
                        setValue('time', t, { shouldValidate: true });
                        setError('');
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="form-grid">
              <Field
                label="Motivo"
                htmlFor="appointment-service"
                required
                error={errors.service?.message}
              >
                <select id="appointment-service" {...register('service')}>
                  {services.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Estado inicial" htmlFor="appointment-status" required>
                <select id="appointment-status" {...register('status')}>
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  {appointmentId && <option value="rescheduled">Reprogramada</option>}
                </select>
              </Field>
            </div>
            <Field label="Notas" htmlFor="appointment-notes" error={errors.notes?.message}>
              <textarea
                id="appointment-notes"
                placeholder="Agrega notas adicionales para recepción…"
                {...register('notes')}
              />
            </Field>
            {error && <Alert>{error}</Alert>}
            <div className="form-actions">
              <Link
                className="btn btn-secondary"
                to={appointmentId ? `/app/citas/${appointmentId}` : '/app/citas'}
              >
                Cancelar
              </Link>
              <Button loading={isSubmitting}>
                Guardar cita <Check size={16} />
              </Button>
            </div>
          </form>
        </Card>
        <aside className="form-tip">
          <div className="tip-icon">
            <CalendarDays size={36} />
          </div>
          <h3>Todo empieza con una cita.</h3>
          <p>Elige un turno disponible y revisa los datos del paciente antes de guardar.</p>
          <ul>
            <li>Horarios en la zona de Lima.</li>
            <li>La disponibilidad se valida al guardar.</li>
            <li>Al reprogramar, se conserva el historial.</li>
          </ul>
        </aside>
      </div>
      <Modal open={newLead} onClose={() => setNewLead(false)} title="Nuevo paciente">
        <LeadForm
          onDone={(lead) => {
            setValue('leadId', lead.id);
            setNewLead(false);
          }}
          onCancel={() => setNewLead(false)}
        />
      </Modal>
    </>
  );
}
