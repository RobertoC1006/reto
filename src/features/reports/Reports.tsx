import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { api } from '../../shared/api/services';
import { useLeadDirectory } from '../../shared/hooks';
import { addDays, dateLabel, statusConfig, timeLabel, today } from '../../shared/utils';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  PageHeader,
  Skeleton,
} from '../../shared/components/ui';
import { StatusChart } from '../dashboard/Dashboard';
import { DataTable } from '../../shared/components/DataTable';
export default function Reports() {
  const [from, setFrom] = useState(addDays(today(), -7)),
    [to, setTo] = useState(today());
  const query = useQuery({
    queryKey: ['reports', from, to],
    queryFn: () => api.reports(from, to),
    enabled: !!from && !!to && from <= to,
  });
  const directory = useLeadDirectory();
  const download = () => {
    if (!query.data) return;
    const cell = (v: string) => '"' + v.replace(/"/g, '""').replace(/^[=+@-]/, "'") + '"';
    const lines = [
      ['Paciente', 'Fecha', 'Hora', 'Motivo', 'Estado'],
      ...query.data.appointments.map((a) => [
        directory.data?.items.find((l) => l.id === a.leadId)?.name || '',
        dateLabel(a.startsAt),
        timeLabel(a.startsAt),
        a.service,
        statusConfig[a.status].label,
      ]),
    ];
    const blob = new Blob(['\ufeff' + lines.map((row) => row.map(cell).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob),
      link = document.createElement('a');
    link.href = url;
    link.download = `praxia-citas-${from}-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <PageHeader
        title="Reportes"
        subtitle="Una mirada clara a la actividad de tu consultorio."
        action={
          <Button variant="secondary" disabled={!query.data || from > to} onClick={download}>
            <Download size={17} /> Exportar CSV
          </Button>
        }
      />
      <Card className="report-filters">
        <Field label="Desde" htmlFor="report-from">
          <input
            id="report-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>
        <Field
          label="Hasta"
          htmlFor="report-to"
          error={from > to ? 'La fecha final debe ser posterior a la inicial.' : undefined}
        >
          <input
            id="report-to"
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
          />
        </Field>
      </Card>
      {from <= to &&
        (query.isPending ? (
          <Skeleton />
        ) : query.error ? (
          <ErrorState error={query.error} retry={() => query.refetch()} />
        ) : (
          query.data && (
            <>
              <div className="reports-summary">
                <Card>
                  <span className="eyebrow">CITAS EN EL PERÍODO</span>
                  <strong className="report-number">{query.data.todayCount}</strong>
                  <p>
                    {dateLabel(from)} — {dateLabel(to)}
                  </p>
                </Card>
                <Card>
                  <h2>Distribución por estado</h2>
                  <StatusChart data={query.data} />
                </Card>
              </div>
              <Card className="table-card">
                <div className="section-heading">
                  <h2>Detalle del período</h2>
                </div>
                <DataTable
                  rows={query.data.appointments}
                  columns={[
                    {
                      key: 'name',
                      label: 'Paciente',
                      render: (a) =>
                        directory.data?.items.find((l) => l.id === a.leadId)?.name || 'Paciente',
                    },
                    { key: 'date', label: 'Fecha', render: (a) => dateLabel(a.startsAt) },
                    { key: 'time', label: 'Hora', render: (a) => timeLabel(a.startsAt) },
                    { key: 'reason', label: 'Motivo', render: (a) => a.service },
                    { key: 'status', label: 'Estado', render: (a) => <Badge status={a.status} /> },
                  ]}
                />
              </Card>
            </>
          )
        ))}
    </>
  );
}
