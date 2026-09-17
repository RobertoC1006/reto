import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, List, Plus } from 'lucide-react';
import { api } from '../../shared/api/services';
import { useLeadDirectory } from '../../shared/hooks';
import { addDays, dateKey, dateLabel, timeLabel, today } from '../../shared/utils';
import { Avatar, Badge, Card, ErrorState, PageHeader, Skeleton } from '../../shared/components/ui';
import { DataTable } from '../../shared/components/DataTable';
export default function Appointments() {
  const [params, setParams] = useSearchParams(),
    [view, setView] = useState<'table' | 'calendar'>('table');
  const date = params.get('date') || today(),
    status = params.get('status') || '',
    page = Number(params.get('page')) || 1;
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };
  const query = useQuery({
    queryKey: ['appointments', { date, status, page, view }],
    queryFn: () =>
      api.appointments({
        date,
        status,
        page: view === 'calendar' ? 1 : page,
        pageSize: view === 'calendar' ? 100 : 8,
      }),
    placeholderData: keepPreviousData,
  });
  const directory = useLeadDirectory();
  const getLead = (id: string) => directory.data?.items.find((l) => l.id === id);
  return (
    <>
      <PageHeader
        title="Citas"
        subtitle="Una agenda clara para una atención más cercana."
        action={
          <Link className="btn btn-primary" to="/app/citas/nueva">
            <Plus size={18} /> Nueva cita
          </Link>
        }
      />
      <Card className="table-card">
        <div className="table-toolbar">
          <div className="segmented">
            <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>
              <List size={16} /> Vista tabla
            </button>
            <button
              className={view === 'calendar' ? 'active' : ''}
              onClick={() => setView('calendar')}
            >
              <CalendarDays size={16} /> Vista calendario
            </button>
          </div>
          <div className="toolbar-filters">
            <div className="date-control">
              <CalendarDays size={16} />
              <input
                type="date"
                aria-label="Fecha de citas"
                value={date}
                onChange={(e) => e.target.value && update('date', e.target.value)}
              />
            </div>
            <select
              aria-label="Filtrar citas por estado"
              value={status}
              onChange={(e) => update('status', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="cancelled">Cancelada</option>
              <option value="rescheduled">Reprogramada</option>
            </select>
          </div>
        </div>
        {query.isPending ? (
          <Skeleton rows={6} />
        ) : query.error ? (
          <ErrorState error={query.error} retry={() => query.refetch()} />
        ) : view === 'table' ? (
          <DataTable
            rows={query.data.items}
            page={page}
            pageSize={8}
            total={query.data.total}
            onPage={(p) => update('page', String(p))}
            columns={[
              { key: 'date', label: 'Fecha', render: (a) => dateLabel(a.startsAt) },
              {
                key: 'time',
                label: 'Hora',
                render: (a) => <span className="time-cell">{timeLabel(a.startsAt)}</span>,
              },
              {
                key: 'patient',
                label: 'Paciente',
                render: (a) => (
                  <Link className="person-cell" to={`/app/citas/${a.id}`}>
                    <Avatar name={getLead(a.leadId)?.name || 'Paciente'} size="small" />
                    <strong>{getLead(a.leadId)?.name || 'Paciente'}</strong>
                  </Link>
                ),
              },
              { key: 'service', label: 'Motivo', render: (a) => a.service },
              { key: 'status', label: 'Estado', render: (a) => <Badge status={a.status} /> },
              {
                key: 'actions',
                label: 'Acciones',
                render: (a) => (
                  <Link
                    className="icon-btn"
                    aria-label={`Ver cita de ${getLead(a.leadId)?.name}`}
                    to={`/app/citas/${a.id}`}
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                ),
              },
            ]}
          />
        ) : (
          <div className="calendar-view">
            <div className="calendar-heading">
              <button
                className="icon-btn"
                aria-label="Día anterior"
                onClick={() => update('date', addDays(date, -1))}
              >
                <ChevronLeft />
              </button>
              <h2>{dateLabel(date, true)}</h2>
              <button
                className="icon-btn"
                aria-label="Día siguiente"
                onClick={() => update('date', addDays(date, 1))}
              >
                <ChevronRight />
              </button>
            </div>
            {Array.from({ length: 11 }, (_, i) => 8 + i).map((hour) => (
              <div className="calendar-row" key={hour}>
                <time>{String(hour).padStart(2, '0')}:00</time>
                <div>
                  {query.data.items
                    .filter(
                      (a) =>
                        dateKey(a.startsAt) === date &&
                        Number(timeLabel(a.startsAt).slice(0, 2)) === hour,
                    )
                    .map((a) => (
                      <Link
                        to={`/app/citas/${a.id}`}
                        className={`calendar-event calendar-${a.status}`}
                        key={a.id}
                      >
                        <strong>
                          {timeLabel(a.startsAt)} · {getLead(a.leadId)?.name}
                        </strong>
                        <span>{a.service}</span>
                        <Badge status={a.status} />
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
