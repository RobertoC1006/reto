import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router';
import {
  Mail,
  Phone,
  UserRound,
  FileText,
  Plus,
  Pencil,
  UserRoundX,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../shared/api/services';
import { useRefresh } from '../../shared/hooks';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  MessageBubble,
  Modal,
  PageHeader,
  SectionHeading,
  Skeleton,
  useToast,
} from '../../shared/components/ui';
import { dateLabel, timeLabel } from '../../shared/utils';
import LeadForm from './LeadForm';
export default function LeadDetail() {
  const { leadId = '' } = useParams(),
    [params, setParams] = useSearchParams(),
    tab = params.get('tab') || 'Información';
  const [edit, setEdit] = useState(false),
    [inactive, setInactive] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const refresh = useRefresh(),
    toast = useToast();
  const leadQuery = useQuery({ queryKey: ['leads', leadId], queryFn: () => api.lead(leadId) });
  const appointments = useQuery({
    queryKey: ['appointments', 'lead', leadId],
    queryFn: () => api.appointments({ leadId, pageSize: 100 }),
  });
  const conversations = useQuery({ queryKey: ['conversations'], queryFn: api.conversations });
  if (leadQuery.isPending) return <Skeleton />;
  if (leadQuery.error)
    return <ErrorState error={leadQuery.error} retry={() => leadQuery.refetch()} />;
  const lead = leadQuery.data,
    conv = conversations.data?.find((c) => c.leadId === leadId);
  return (
    <>
      <PageHeader
        title="Detalle del paciente"
        back="/app/leads"
        action={
          <Button variant="secondary" onClick={() => setEdit(true)}>
            <Pencil size={16} /> Editar
          </Button>
        }
      />
      <Card className="detail-card">
        <div className="profile-heading">
          <Avatar name={lead.name} size="large" />
          <div>
            <div className="profile-title">
              <h2>{lead.name}</h2>
              <Badge status={lead.status} />
            </div>
            <p>
              {lead.phone} <span>·</span> {lead.email || 'Sin correo registrado'}
            </p>
            <p>
              Origen: {lead.origin} <span>·</span> Registro: {dateLabel(lead.createdAt)}
            </p>
          </div>
        </div>
        <div className="tabs" role="tablist" aria-label="Información del paciente">
          {['Información', 'Citas', 'Mensajes', 'Historial'].map((t) => (
            <button
              role="tab"
              aria-selected={tab === t}
              className={tab === t ? 'active' : ''}
              onClick={() => setParams({ tab: t })}
              key={t}
            >
              {t}
            </button>
          ))}
        </div>
        {error && <Alert>{error}</Alert>}
        <div className="detail-body">
          {tab === 'Información' && (
            <div className="detail-grid">
              <div className="inset-panel">
                <h3>Datos personales</h3>
                {[
                  { label: 'Nombre completo', value: lead.name, icon: UserRound },
                  { label: 'Teléfono', value: lead.phone, icon: Phone },
                  { label: 'Email', value: lead.email || 'Sin correo registrado', icon: Mail },
                  { label: 'Notas', value: lead.notes || 'Sin notas adicionales.', icon: FileText },
                ].map(({ label, value, icon: Icon }) => (
                  <div className="info-row" key={label}>
                    <Icon size={18} />
                    <div>
                      <strong>{label}</strong>
                      <p>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="inset-panel quick-actions">
                <h3>Acciones rápidas</h3>
                <Link className="btn btn-primary" to={`/app/citas/nueva?leadId=${leadId}`}>
                  <Plus size={17} /> Crear cita
                </Link>
                <Link
                  className="btn btn-secondary"
                  to={
                    conv
                      ? `/app/mensajes?conversation=${conv.id}`
                      : `/app/mensajes?leadId=${leadId}`
                  }
                >
                  <MessageSquare size={17} /> Enviar mensaje
                </Link>
                <Button variant="secondary" onClick={() => setEdit(true)}>
                  <Pencil size={16} /> Editar datos
                </Button>
                <Button
                  variant={lead.status === 'inactive' ? 'secondary' : 'danger'}
                  onClick={() => setInactive(true)}
                >
                  <UserRoundX size={17} />
                  {lead.status === 'inactive' ? 'Reactivar paciente' : 'Marcar como inactivo'}
                </Button>
              </div>
            </div>
          )}
          {tab === 'Citas' && (
            <div className="detail-list">
              {appointments.error ? (
                <ErrorState error={appointments.error} retry={() => appointments.refetch()} />
              ) : appointments.data?.items.length ? (
                appointments.data.items.map((a) => (
                  <Link to={`/app/citas/${a.id}`} key={a.id}>
                    <div>
                      <strong>{a.service}</strong>
                      <p>
                        {dateLabel(a.startsAt)} · {timeLabel(a.startsAt)}
                      </p>
                    </div>
                    <Badge status={a.status} />
                  </Link>
                ))
              ) : (
                <p>
                  No hay citas registradas.{' '}
                  <Link to={`/app/citas/nueva?leadId=${leadId}`}>Agendar una cita</Link>
                </p>
              )}
            </div>
          )}
          {tab === 'Mensajes' && (
            <>
              {conversations.error ? (
                <ErrorState error={conversations.error} retry={() => conversations.refetch()} />
              ) : conv ? (
                <div className="detail-messages">
                  {conv.messages.map((m) => (
                    <MessageBubble key={m.id} item={m} />
                  ))}
                </div>
              ) : (
                <p>No hay conversaciones todavía.</p>
              )}
            </>
          )}
          {tab === 'Historial' && (
            <>
              <SectionHeading title="Actividad del paciente" />
              <div className="timeline">
                {[...lead.history].reverse().map((h) => (
                  <div key={h.id}>
                    <span />
                    <strong>{h.title}</strong>
                    <small>
                      {dateLabel(h.at)} · {timeLabel(h.at)}
                    </small>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>
      <Modal open={edit} onClose={() => setEdit(false)} title="Editar paciente">
        <LeadForm lead={lead} onDone={() => setEdit(false)} onCancel={() => setEdit(false)} />
      </Modal>
      <ConfirmDialog
        open={inactive}
        loading={busy}
        onClose={() => setInactive(false)}
        title={lead.status === 'inactive' ? 'Reactivar paciente' : 'Marcar como inactivo'}
        message="Se conservarán sus citas y el historial de atención."
        onConfirm={async () => {
          setBusy(true);
          try {
            await api.saveLead(
              { status: lead.status === 'inactive' ? 'contacted' : 'inactive' },
              leadId,
            );
            await refresh();
            toast('Estado del paciente actualizado');
            setInactive(false);
          } catch (err) {
            setError((err as Error).message);
            setInactive(false);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
