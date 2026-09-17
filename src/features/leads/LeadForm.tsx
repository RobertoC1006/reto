import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../shared/api/services';
import { ApiError } from '../../shared/api/client';
import type { Lead } from '../../shared/types';
import { Alert, Button, Field, useToast } from '../../shared/components/ui';
import { useRefresh } from '../../shared/hooks';
import { useState } from 'react';
const schema = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre completo.'),
  phone: z.string().regex(/^\+?[\d\s()-]{7,20}$/, 'Introduce un teléfono válido.'),
  email: z.union([z.email('Revisa el correo electrónico.'), z.literal('')]),
  origin: z.enum(['WhatsApp', 'Web', 'Referido']),
  notes: z.string().max(500, 'Usa como máximo 500 caracteres.'),
});
type Values = z.infer<typeof schema>;
export default function LeadForm({
  lead,
  onDone,
  onCancel,
}: {
  lead?: Lead;
  onDone: (lead: Lead) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState('');
  const toast = useToast(),
    refresh = useRefresh();
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: lead || { name: '', phone: '', email: '', origin: 'Web', notes: '' },
  });
  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        setError('');
        try {
          const result = await api.saveLead(values, lead?.id);
          await refresh();
          toast(lead ? 'Paciente actualizado' : 'Paciente registrado');
          onDone(result);
        } catch (err) {
          setError((err as Error).message);
          if (err instanceof ApiError && err.fieldErrors)
            Object.entries(err.fieldErrors).forEach(([key, message]) =>
              setFieldError(key as keyof Values, { message }),
            );
        }
      })}
    >
      <Field label="Nombre completo" htmlFor="lead-name" required error={errors.name?.message}>
        <input
          id="lead-name"
          autoFocus
          autoComplete="name"
          placeholder="Ej. Ana Torres"
          {...register('name')}
        />
      </Field>
      <div className="form-grid">
        <Field label="Teléfono" htmlFor="lead-phone" required error={errors.phone?.message}>
          <input
            id="lead-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+51 900 000 123"
            {...register('phone')}
          />
        </Field>
        <Field label="Correo electrónico" htmlFor="lead-email" error={errors.email?.message}>
          <input
            id="lead-email"
            type="email"
            placeholder="nombre@example.com"
            {...register('email')}
          />
        </Field>
      </div>
      <Field label="Origen" htmlFor="lead-origin">
        <select id="lead-origin" {...register('origin')}>
          <option>Web</option>
          <option>WhatsApp</option>
          <option>Referido</option>
        </select>
      </Field>
      <Field label="Notas" htmlFor="lead-notes" error={errors.notes?.message}>
        <textarea
          id="lead-notes"
          placeholder="Preferencias de atención, información de contacto..."
          {...register('notes')}
        />
      </Field>
      {error && <Alert>{error}</Alert>}
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button loading={isSubmitting}>Guardar paciente</Button>
      </div>
    </form>
  );
}
