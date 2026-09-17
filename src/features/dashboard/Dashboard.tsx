import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import {
  CalendarDays,
  Clock3,
  CircleCheck,
  CircleX,
  Users,
  ArrowUpRight,
  ArrowRight,
  Sun,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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
import { DataTable } from '../../shared/components/DataTable';
import { useLeadDirectory } from '../../shared/hooks';
import { dateLabel, timeLabel, today } from '../../shared/utils';
import type { Dashboard as DashboardData } from '../../shared/types';
export function MetricCards({ data }: { data: DashboardData }) {
  const items = [
    {
      label: 'Citas de hoy',
      value: data.todayCount,
      icon: CalendarDays,
      tone: 'blue',
      caption: 'En tu agenda',
      link: '/app/citas',
    },
    {
      label: 'Pendientes',
      value: data.pending,
      icon: Clock3,
      tone: 'amber',
      caption: 'Por confirmar',
      link: '/app/citas?status=pending',
    },
    {
      label: 'Confirmadas',
      value: data.confirmed,
      icon: CircleCheck,
      tone: 'green',
      caption: 'Todo listo',
      link: '/app/citas?status=confirmed',
    },
    {
      label: 'Canceladas',
      value: data.cancelled,
      icon: CircleX,
      tone: 'rose',
      caption: 'Turnos liberados',
      link: '/app/citas?status=cancelled',
    },
    {
      label: 'Total de leads',
      value: data.totalLeads,
      icon: Users,
      tone: 'teal',
      caption: 'Personas registradas',
      link: '/app/leads',
    },
  ];
  return (
    <div className="metric-grid">
      {items.map(({ label, value, icon: Icon, tone, caption, link }) => (
        <Link
          to={
            link +
            (link.includes('citas') ? `${link.includes('?') ? '&' : '?'}date=${data.date}` : '')
          }
          className={`metric-card metric-${tone}`}
          key={label}
        >
          <div className="metric-top">
            <span className="metric-icon">
              <Icon size={21} />
            </span>
            <ArrowUpRight size={16} />
          </div>
          <div className="metric-number">{value}</div>
          <div className="metric-label">{label}</div>
          <small>{caption}</small>
        </Link>
      ))}
    </div>
  );
}
export function StatusChart({ data }: { data: DashboardData }) {
  const parts = [
    { name: 'Confirmadas', value: data.confirmed, color: '#32b98b' },
    { name: 'Pendientes', value: data.pending, color: '#f2bd55' },
    { name: 'Canceladas', value: data.cancelled, color: '#f16b7b' },
    { name: 'Reprogramadas', value: data.rescheduled, color: '#669fed' },
  ];
  return (
    <div className="status-chart">
      <div className="donut">
        <ResponsiveContainer width="100%" height={164}>
          <PieChart>
            <Pie
              data={parts}
              dataKey="value"
              innerRadius={53}
              outerRadius={70}
              paddingAngle={4}
              cornerRadius={5}
              stroke="none"
              isAnimationActive={false}
            >
              {parts.map((p) => (
                <Cell key={p.name} fill={p.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-label">
          <strong>{data.todayCount}</strong>
          <span>citas</span>
        </div>
      </div>
      <div className="chart-legend">
        {parts.map((p) => (
          <div key={p.name}>
            <span style={{ background: p.color }} />
            <label>{p.name}</label>
            <strong>{p.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
export default function Dashboard() {
  const [date, setDate] = useState(today());
  const query = useQuery({
    queryKey: ['dashboard', date],
    queryFn: () => api.dashboard(date),
    refetchInterval: 15000,
  });
  const directory = useLeadDirectory();
  if (query.isPending) return <Skeleton rows={7} />;
  if (query.error) return <ErrorState error={query.error} retry={() => query.refetch()} />;
  const data = query.data;
  return (
    <>
      <PageHeader
        title="Hola, Dr. Roberto"
        subtitle="Un nuevo día para cuidar. Así va tu consultorio hoy."
        action={
          <div className="date-control">
            <CalendarDays size={16} />
            <input
              type="date"
              aria-label="Fecha del dashboard"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </div>
        }
      />
      <div className="today-label">
        <Sun size={15} />
        <span>{dateLabel(date, true)}</span>
        <span className="live-dot" /> Tu consultorio, al día
      </div>
      <MetricCards data={data} />
      <div className="dashboard-grid">
        <Card className="appointments-today">
          <SectionHeading title="Próximas citas" to={`/app/citas?date=${date}`} />
          <DataTable
            rows={data.appointments.filter((a) => a.status !== 'cancelled').slice(0, 7)}
            columns={[
              {
                key: 'time',
                label: 'Hora',
                render: (a) => <span className="time-cell">{timeLabel(a.startsAt)}</span>,
              },
              {
                key: 'name',
                label: 'Paciente',
                render: (a) => {
                  const lead = directory.data?.items.find((l) => l.id === a.leadId);
                  return (
                    <Link className="person-cell" to={`/app/citas/${a.id}`}>
                      <Avatar name={lead?.name || 'Paciente'} size="small" />
                      <strong>{lead?.name || 'Paciente'}</strong>
                    </Link>
                  );
                },
              },
              { key: 'reason', label: 'Motivo', render: (a) => a.service },
              { key: 'status', label: 'Estado', render: (a) => <Badge status={a.status} /> },
            ]}
          />
          <Link className="card-footer-link" to="/app/citas/nueva">
            <CalendarDays size={17} /> Agendar una nueva cita <ArrowRight size={16} />
          </Link>
        </Card>
        <div className="dashboard-side">
          <Card>
            <SectionHeading title="Estado de citas" />
            <StatusChart data={data} />
          </Card>
          <Card>
            <SectionHeading title="Leads recientes" to="/app/leads" />
            <div className="recent-leads">
              {data.recentLeads.map((l) => (
                <Link to={`/app/leads/${l.id}`} key={l.id}>
                  <Avatar name={l.name} />
                  <div>
                    <strong>{l.name}</strong>
                    <small>{l.origin}</small>
                  </div>
                  <Badge status={l.status} />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <div className="care-banner">
        <span className="care-banner-icon">
          <CircleCheck size={25} />
        </span>
        <div>
          <strong>Cada cita es una oportunidad de cuidar.</strong>
          <p>Organiza tu día y dedica más tiempo a lo que importa: tus pacientes.</p>
        </div>
        <Link to="/app/mensajes">
          Ir a mensajes <ArrowRight size={17} />
        </Link>
      </div>
    </>
  );
}
