import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { CalendarDays, Clock3, FileText, MapPin } from 'lucide-react';
import { api } from '../../shared/api/services';
import {
  Avatar,
  Badge,
  Card,
  ErrorState,
  PageHeader,
  SectionHeading,
  Skeleton,
} from '../../shared/components/ui';
import { dateLabel, timeLabel } from '../../shared/utils';
import AppointmentActions from './AppointmentActions';
export default function AppointmentDetail() {
  const { appointmentId = '' } = useParams();
  const query = useQuery({
    queryKey: ['appointments', appointmentId],
    queryFn: () => api.appointment(appointmentId),
  });
  const lead = useQuery({
    queryKey: ['leads', query.data?.leadId],
    queryFn: () => api.lead(query.data!.leadId),
    enabled: !!query.data?.leadId,
  });
  if (query.isPending) return <Skeleton />;
  if (query.error) return <ErrorState error={query.error} retry={() => query.refetch()} />;
  const a = query.data;
  return (
    <>
      <PageHeader
        title="Detalle de la cita"
        back="/app/citas"
        subtitle="Consulta la reserva y acompaña cada paso de la atención."
      />
      <Card className="detail-card">
        <div className="profile-heading">
          <Avatar name={lead.data?.name || 'Paciente'} size="large" />
          <div>
            <div className="profile-title">
              <Link to={`/app/leads/${a.leadId}`}>
                <h2>{lead.data?.name || 'Paciente'}</h2>
              </Link>
              <Badge status={a.status} />
            </div>
            <p>{lead.data?.phone}</p>
            <p>Origen: {lead.data?.origin || 'Web'}</p>
          </div>
        </div>
        <div className="detail-body">
          <div className="detail-grid">
            <div>
              <div className="appointment-info">
                {[
                  { label: 'Fecha', value: dateLabel(a.startsAt, true), icon: CalendarDays },
                  { label: 'Hora', value: timeLabel(a.startsAt), icon: Clock3 },
                  { label: 'Motivo', value: a.service, icon: FileText },
                  { label: 'Lugar', value: 'Praxia · Consultorios', icon: MapPin },
                ].map(({ label, value, icon: Icon }) => (
                  <div className="info-row" key={label}>
                    <Icon size={19} />
                    <div>
                      <strong>{label}</strong>
                      <p>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {a.notes && <p className="appointment-notes">{a.notes}</p>}
              <SectionHeading title="Historial de cambios" />
              <div className="timeline">
                {[...a.history].reverse().map((h) => (
                  <div key={h.id}>
                    <span />
                    <strong>{h.title}</strong>
                    <small>
                      {dateLabel(h.at)} · {timeLabel(h.at)}
                    </small>
                  </div>
                ))}
              </div>
            </div>
            <div className="inset-panel">
              <h3>Gestionar cita</h3>
              <AppointmentActions appointment={a} />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
