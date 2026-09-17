import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Save, ShieldCheck } from 'lucide-react';
import { api } from '../../shared/api/services';
import type { Settings as SettingsData } from '../../shared/types';
import {
  Alert,
  Avatar,
  Button,
  Card,
  ErrorState,
  Field,
  PageHeader,
  Skeleton,
  useToast,
} from '../../shared/components/ui';
export default function Settings() {
  const query = useQuery({ queryKey: ['settings'], queryFn: api.settings }),
    client = useQueryClient(),
    toast = useToast();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<SettingsData>();
  useEffect(() => {
    if (query.data) reset(query.data);
  }, [query.data, reset]);
  if (query.isPending) return <Skeleton />;
  if (query.error) return <ErrorState error={query.error} retry={() => query.refetch()} />;
  return (
    <>
      <PageHeader title="Configuración" subtitle="Un consultorio organizado, a tu manera." />
      <div className="settings-grid">
        <Card className="settings-profile">
          <Avatar name="Dr. Roberto" size="large" />
          <h2>Dr. Roberto</h2>
          <p>admin@praxia.demo</p>
          <span className="badge badge-info">
            <ShieldCheck size={14} /> Administrador
          </span>
          <p>Gestión de pacientes, agenda y mensajes del consultorio.</p>
        </Card>
        <Card className="form-card">
          <h2>Datos del consultorio</h2>
          <p className="muted">
            Esta información se utiliza en la landing y en la disponibilidad de citas.
          </p>
          <form
            onSubmit={handleSubmit(async (values) => {
              setError('');
              try {
                await api.saveSettings(values);
                await client.invalidateQueries();
                toast('Configuración guardada');
              } catch (err) {
                setError((err as Error).message);
              }
            })}
          >
            <div className="form-grid">
              <Field label="Nombre" htmlFor="setting-name" required>
                <input id="setting-name" {...register('clinicName', { required: true })} />
              </Field>
              <Field label="Teléfono" htmlFor="setting-phone" required>
                <input id="setting-phone" {...register('phone', { required: true })} />
              </Field>
            </div>
            <Field label="Dirección" htmlFor="setting-address">
              <input id="setting-address" {...register('address')} />
            </Field>
            <div className="form-grid">
              <Field label="Hora de apertura" htmlFor="setting-opens">
                <input
                  id="setting-opens"
                  type="time"
                  {...register('opensAt', { required: true })}
                />
              </Field>
              <Field label="Hora de cierre" htmlFor="setting-closes">
                <input
                  id="setting-closes"
                  type="time"
                  {...register('closesAt', { required: true })}
                />
              </Field>
            </div>
            <div className="form-grid">
              <Field label="Duración de las citas" htmlFor="setting-slot">
                <select id="setting-slot" {...register('slotMinutes', { valueAsNumber: true })}>
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>60 minutos</option>
                </select>
              </Field>
              <Field label="Zona horaria" htmlFor="setting-timezone">
                <input id="setting-timezone" {...register('timezone')} readOnly />
              </Field>
            </div>
            {error && <Alert>{error}</Alert>}
            <div className="form-actions">
              <Button loading={isSubmitting}>
                <Save size={17} /> Guardar cambios
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
