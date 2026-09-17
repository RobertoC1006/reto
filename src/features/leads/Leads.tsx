import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { ArrowUpRight, Plus, SlidersHorizontal } from 'lucide-react';
import { api } from '../../shared/api/services';
import { useDebounce } from '../../shared/hooks';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ErrorState,
  Modal,
  PageHeader,
  SearchInput,
  Skeleton,
  WhatsAppIcon,
} from '../../shared/components/ui';
import { DataTable } from '../../shared/components/DataTable';
import LeadForm from './LeadForm';
export default function Leads() {
  const [params, setParams] = useSearchParams(),
    [open, setOpen] = useState(false),
    [filters, setFilters] = useState(false);
  const search = params.get('q') || '',
    status = params.get('status') || '',
    origin = params.get('origin') || '',
    page = Number(params.get('page')) || 1,
    q = useDebounce(search);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };
  const query = useQuery({
    queryKey: ['leads', { q, status, origin, page }],
    queryFn: () => api.leads({ q, status, origin, page }),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader
        title="Leads / Pacientes"
        subtitle="Cada conversación es el comienzo de una mejor atención."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={18} /> Nuevo lead
          </Button>
        }
      />
      <Card className="table-card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={(v) => update('q', v)} />
          <Button variant="secondary" onClick={() => setFilters(!filters)} aria-expanded={filters}>
            <SlidersHorizontal size={17} /> Filtros
            {(status || origin) && <span className="filter-dot" />}
          </Button>
        </div>
        {filters && (
          <div className="filter-bar">
            <select
              aria-label="Estado del lead"
              value={status}
              onChange={(e) => update('status', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="new">Nuevo</option>
              <option value="contacted">Contactado</option>
              <option value="converted">Convertido</option>
              <option value="inactive">Inactivo</option>
            </select>
            <select
              aria-label="Origen del lead"
              value={origin}
              onChange={(e) => update('origin', e.target.value)}
            >
              <option value="">Todos los orígenes</option>
              <option>WhatsApp</option>
              <option>Web</option>
              <option>Referido</option>
            </select>
            <button className="text-button" onClick={() => setParams({})}>
              Limpiar filtros
            </button>
          </div>
        )}
        {query.isPending ? (
          <Skeleton rows={6} />
        ) : query.error ? (
          <ErrorState error={query.error} retry={() => query.refetch()} />
        ) : (
          <DataTable
            rows={query.data.items}
            page={page}
            total={query.data.total}
            onPage={(v) => update('page', String(v))}
            columns={[
              {
                key: 'name',
                label: 'Nombre',
                render: (lead) => (
                  <Link className="person-cell" to={`/app/leads/${lead.id}`}>
                    <Avatar name={lead.name} />
                    <strong>{lead.name}</strong>
                  </Link>
                ),
              },
              { key: 'phone', label: 'Teléfono', render: (l) => l.phone },
              { key: 'email', label: 'Email', render: (l) => l.email || '—' },
              {
                key: 'origin',
                label: 'Origen',
                render: (l) => (
                  <span className="origin-cell">
                    {l.origin === 'WhatsApp' && <WhatsAppIcon size={16} />} {l.origin}
                  </span>
                ),
              },
              { key: 'status', label: 'Estado', render: (l) => <Badge status={l.status} /> },
              {
                key: 'actions',
                label: 'Acciones',
                render: (l) => (
                  <Link
                    className="icon-btn"
                    aria-label={`Ver a ${l.name}`}
                    to={`/app/leads/${l.id}`}
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                ),
              },
            ]}
          />
        )}
      </Card>
      <p className="page-footnote">Toda la información de tus pacientes, en un solo lugar.</p>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo lead / paciente"
        description="Completa los datos de contacto para empezar."
      >
        <LeadForm onDone={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </Modal>
    </>
  );
}
