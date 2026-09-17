import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowUpRight, Send } from 'lucide-react';
import { api } from '../../shared/api/services';
import {
  Avatar,
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  MessageBubble,
  Modal,
  PageHeader,
  SearchInput,
  Skeleton,
  useToast,
  WhatsAppIcon,
} from '../../shared/components/ui';
import { useLeadDirectory, useRefresh } from '../../shared/hooks';
import { timeLabel } from '../../shared/utils';
export default function Messages() {
  const [params, setParams] = useSearchParams(),
    [search, setSearch] = useState(''),
    [draft, setDraft] = useState(''),
    [simulate, setSimulate] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [simError, setSimError] = useState('');
  const directory = useLeadDirectory(),
    refresh = useRefresh(),
    toast = useToast(),
    end = useRef<HTMLDivElement>(null),
    pendingSend = useRef<{ text: string; id: string } | null>(null);
  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: api.conversations,
    refetchInterval: 4000,
  });
  const leadForNew = directory.data?.items.find((l) => l.id === params.get('leadId'));
  const selected = query.data?.find((c) => c.id === params.get('conversation'));
  const selectedLead = directory.data?.items.find((l) => l.id === selected?.leadId);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected?.messages.length]);
  const list = query.data?.filter((c) =>
    (directory.data?.items.find((l) => l.id === c.leadId)?.name || '')
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Mensajes"
        subtitle="Conversaciones que acercan tu consultorio a tus pacientes."
        action={
          <Button
            variant="whatsapp"
            onClick={() => {
              setSimError('');
              setSimulate(true);
            }}
          >
            <WhatsAppIcon size={18} /> Simular mensaje
          </Button>
        }
      />
      {error && <Alert>{error}</Alert>}
      <Card className={`messages-shell ${selected ? 'has-conversation' : ''}`}>
        <aside className="conversation-sidebar">
          <div className="conversation-title">
            <h2>WhatsApp</h2>
            <span className="badge badge-success">Simulación</span>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar conversación..." />
          {query.isPending ? (
            <Skeleton />
          ) : query.error ? (
            <ErrorState error={query.error} retry={() => query.refetch()} />
          ) : (
            <div className="conversation-list">
              {list?.map((c) => {
                const lead = directory.data?.items.find((l) => l.id === c.leadId);
                return (
                  <button
                    className={selected?.id === c.id ? 'active' : ''}
                    key={c.id}
                    onClick={() => {
                      setParams({ conversation: c.id });
                      setError('');
                    }}
                  >
                    <Avatar name={lead?.name || 'Paciente'} />
                    <div>
                      <strong>{lead?.name || 'Paciente'}</strong>
                      <p>{c.messages.at(-1)?.text}</p>
                    </div>
                    <aside>
                      <time>{c.messages.at(-1) && timeLabel(c.messages.at(-1)!.createdAt)}</time>
                      {c.unread > 0 && <span className="unread-dot" />}
                    </aside>
                  </button>
                );
              })}
              {!list?.length && (
                <EmptyState title="Sin conversaciones" message="Simula un mensaje para comenzar." />
              )}
            </div>
          )}
        </aside>
        <div className="conversation-main">
          {selected ? (
            <>
              <header className="conversation-header">
                <button
                  className="icon-btn conversation-back"
                  aria-label="Volver a conversaciones"
                  onClick={() => setParams({})}
                >
                  <ArrowLeft />
                </button>
                <Avatar name={selectedLead?.name || 'Paciente'} />
                <div>
                  <strong>{selectedLead?.name}</strong>
                  <small>{selectedLead?.phone}</small>
                </div>
                <Link className="btn btn-ghost" to={`/app/leads/${selected.leadId}`}>
                  Ver paciente <ArrowUpRight size={15} />
                </Link>
              </header>
              <div className="conversation-thread">
                <div className="chat-date">Conversación de WhatsApp</div>
                {selected.messages.map((m) => (
                  <MessageBubble key={m.id} item={m} />
                ))}
                <div ref={end} />
              </div>
              <form
                className="chat-composer"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!draft.trim() || busy) return;
                  setBusy(true);
                  setError('');
                  if (!pendingSend.current || pendingSend.current.text !== draft.trim())
                    pendingSend.current = { text: draft.trim(), id: crypto.randomUUID() };
                  try {
                    await api.sendMessage(selected.id, draft.trim(), pendingSend.current.id);
                    setDraft('');
                    pendingSend.current = null;
                    await refresh();
                  } catch (err) {
                    setError((err as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <input
                  aria-label="Respuesta al paciente"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escribe una respuesta..."
                  maxLength={2000}
                />
                <Button aria-label="Enviar respuesta" disabled={!draft.trim()} loading={busy}>
                  <Send size={19} />
                </Button>
              </form>
            </>
          ) : (
            <div className="conversation-placeholder">
              <span>
                <WhatsAppIcon size={44} />
              </span>
              <h2>Una atención más cercana</h2>
              <p>Selecciona una conversación para leer los mensajes y acompañar a tus pacientes.</p>
              {leadForNew && (
                <Button onClick={() => setSimulate(true)}>
                  Iniciar conversación con {leadForNew.name}
                </Button>
              )}
              <small>WhatsApp · Mensajes simulados</small>
            </div>
          )}
        </div>
      </Card>
      <Modal
        open={simulate}
        onClose={() => setSimulate(false)}
        title="Simular mensaje de WhatsApp"
        description="El mensaje aparecerá en la bandeja y se asociará a un lead."
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setSimError('');
            const form = new FormData(e.currentTarget);
            try {
              const conv = await api.simulate({
                name: String(form.get('name')),
                phone: String(form.get('phone')),
                text: String(form.get('text')),
                clientId: crypto.randomUUID(),
              });
              await refresh();
              setParams({ conversation: conv.id });
              setSimulate(false);
              toast('Mensaje recibido y paciente asociado');
            } catch (err) {
              setSimError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Nombre del paciente" htmlFor="sim-name" required>
            <input
              id="sim-name"
              name="name"
              defaultValue={leadForNew?.name}
              required
              placeholder="Ej. Andrea Rojas"
            />
          </Field>
          <Field label="Teléfono" htmlFor="sim-phone" required>
            <input
              id="sim-phone"
              name="phone"
              defaultValue={leadForNew?.phone}
              type="tel"
              required
              pattern="[+0-9 ()-]{7,20}"
              placeholder="+51 900 000 123"
            />
          </Field>
          <Field label="Mensaje recibido" htmlFor="sim-text" required>
            <textarea
              id="sim-text"
              name="text"
              required
              placeholder="Hola, quisiera agendar una cita."
            />
          </Field>
          {simError && <Alert>{simError}</Alert>}
          <div className="form-actions">
            <Button variant="secondary" type="button" onClick={() => setSimulate(false)}>
              Cancelar
            </Button>
            <Button variant="whatsapp" loading={busy}>
              <Send size={16} /> Simular mensaje recibido
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
