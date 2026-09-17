import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  ChevronLeft,
  Clock3,
  FileText,
  Phone,
  Send,
  Smile,
  UserRound,
  X,
  Check,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../shared/api/services';
import type { PublicSession } from '../../shared/types';
import { addDays, dateLabel, services, timeLabel, today, toISO } from '../../shared/utils';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  Logo,
  MessageBubble,
  Skeleton,
} from '../../shared/components/ui';
import { useRefresh } from '../../shared/hooks';
export default function WhatsAppChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [id, setId] = useState(() => sessionStorage.getItem('praxia:public-session') || ''),
    [draft, setDraft] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [menu, setMenu] = useState(true),
    [date, setDate] = useState(addDays(today(), 1)),
    [time, setTime] = useState(''),
    [review, setReview] = useState(false),
    [reschedule, setReschedule] = useState(false),
    [cancel, setCancel] = useState(false),
    [info, setInfo] = useState(false);
  const client = useQueryClient(),
    refresh = useRefresh(),
    end = useRef<HTMLDivElement>(null),
    requestId = useRef<{ payload: string; id: string } | null>(null);
  const session = useQuery({
    queryKey: ['public-session', id],
    queryFn: () => api.session(id),
    enabled: !!id && open,
    refetchInterval: open ? 4000 : false,
  });
  const slots = useQuery({
    queryKey: ['availability', date, session.data?.appointment?.id],
    queryFn: () => api.availability(date, session.data?.appointment?.id),
    enabled: open && (session.data?.step === 'date' || reschedule),
  });
  const settings = useQuery({
    queryKey: ['public-settings'],
    queryFn: api.publicSettings,
    enabled: open,
  });
  const current = session.data;
  useEffect(() => {
    if (open) end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [current?.messages.length, current?.step, review, menu, open, reschedule]);
  const apply = (value: PublicSession) => {
    setId(value.id);
    sessionStorage.setItem('praxia:public-session', value.id);
    client.setQueryData(['public-session', value.id], value);
    setMenu(false);
  };
  const start = async () => {
    setBusy(true);
    setError('');
    try {
      apply(await api.startSession());
      setInfo(false);
      setReview(false);
      setReschedule(false);
      setTime('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError('');
    const payload = `${id}:${text}`;
    if (requestId.current?.payload !== payload)
      requestId.current = { payload, id: crypto.randomUUID() };
    try {
      apply(await api.publicMessage(id, text, requestId.current.id));
      setDraft('');
      requestId.current = null;
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const book = async () => {
    setBusy(true);
    setError('');
    const payload = `${id}:${date}:${time}`;
    if (requestId.current?.payload !== payload)
      requestId.current = { payload, id: crypto.randomUUID() };
    try {
      apply(await api.publicBook(id, toISO(date, time), requestId.current.id));
      requestId.current = null;
      setReview(false);
      setReschedule(false);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
      setReview(false);
      setTime('');
      void slots.refetch();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog.Root open={open} onOpenChange={(value) => !value && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="chat-overlay" />
        <Dialog.Content className="whatsapp-window" aria-describedby={undefined}>
          <header className="whatsapp-header">
            <button
              className="icon-btn"
              aria-label="Menú de WhatsApp"
              onClick={() => {
                setMenu(true);
                setInfo(false);
              }}
            >
              <ChevronLeft size={22} />
            </button>
            <div className="chat-logo">
              <Logo />
            </div>
            <div>
              <Dialog.Title>Praxia</Dialog.Title>
              <span className="online-label">
                <i /> en línea
              </span>
            </div>
            <button
              className="icon-btn"
              aria-label="Información de contacto"
              onClick={() => {
                setMenu(true);
                setInfo(true);
              }}
            >
              <Phone size={18} />
            </button>
            <Dialog.Close className="icon-btn" aria-label="Cerrar chat">
              <X size={21} />
            </Dialog.Close>
          </header>
          <div className="whatsapp-thread">
            <div className="chat-date">Hoy</div>
            {menu ? (
              <>
                <div className="message-bubble">
                  <p>
                    ¡Hola! Soy el asistente virtual de Praxia. Te ayudaré a agendar tu cita de forma
                    rápida y sencilla.
                  </p>
                  <span>{timeLabel(new Date().toISOString())}</span>
                </div>
                {info ? (
                  <div className="chat-option-card">
                    <h3>Estamos para cuidarte</h3>
                    <p>{settings.data?.address || 'Consultorio Praxia, Lima'}</p>
                    <p>{settings.data?.phone || '+51 900 000 000'}</p>
                    <p>
                      Atención: {settings.data?.opensAt || '08:00'}–
                      {settings.data?.closesAt || '18:00'}
                    </p>
                    <Button variant="teal" onClick={() => setInfo(false)}>
                      Volver al menú
                    </Button>
                  </div>
                ) : (
                  <div className="chat-option-card">
                    <p>¿Qué te gustaría hacer?</p>
                    <Button
                      variant="teal"
                      onClick={() =>
                        current && current.step !== 'booked' ? setMenu(false) : start()
                      }
                      loading={busy}
                    >
                      <CalendarDays size={17} />{' '}
                      {current && current.step !== 'booked'
                        ? 'Continuar mi reserva'
                        : 'Agendar una cita'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (current?.appointment) setMenu(false);
                        else
                          setError(
                            'Todavía no tienes una cita en esta conversación. Elige “Agendar una cita” para comenzar.',
                          );
                      }}
                    >
                      <FileText size={17} /> Consultar mis citas
                    </Button>
                    <Button variant="secondary" onClick={() => setInfo(true)}>
                      Más información
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                {session.isPending ? (
                  <Skeleton rows={2} />
                ) : (
                  current?.messages.map((m) => (
                    <MessageBubble audience="patient" key={m.id} item={m} />
                  ))
                )}
                {current?.step === 'service' && (
                  <div className="chat-option-card">
                    {services.map((s) => (
                      <Button disabled={busy} variant="secondary" key={s} onClick={() => send(s)}>
                        {s}
                      </Button>
                    ))}
                  </div>
                )}
                {(current?.step === 'date' || reschedule) && !review && (
                  <div className="chat-option-card">
                    <h3>Elige tu fecha y hora</h3>
                    <label className="sr-only" htmlFor="chat-date">
                      Fecha de tu cita
                    </label>
                    <input
                      id="chat-date"
                      type="date"
                      min={today()}
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setTime('');
                      }}
                    />
                    {slots.isPending ? (
                      <Skeleton rows={2} />
                    ) : slots.error ? (
                      <Alert>{slots.error.message}</Alert>
                    ) : (
                      <div className="slot-grid">
                        {slots.data?.map((t) => (
                          <button
                            className={time === t ? 'selected' : ''}
                            aria-pressed={time === t}
                            key={t}
                            onClick={() => setTime(t)}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                    {slots.data?.length === 0 && (
                      <p>No hay horarios disponibles. Prueba otra fecha.</p>
                    )}
                    <Button variant="teal" disabled={!time} onClick={() => setReview(true)}>
                      Revisar mi cita
                    </Button>
                    {reschedule && (
                      <Button variant="ghost" onClick={() => setReschedule(false)}>
                        Volver a mi cita
                      </Button>
                    )}
                  </div>
                )}
                {review && (
                  <div className="chat-option-card">
                    <h3>Revisa los datos de tu cita</h3>
                    <div className="chat-summary">
                      <p>
                        <UserRound size={16} />
                        {current?.name}
                      </p>
                      <p>
                        <FileText size={16} />
                        {current?.service}
                      </p>
                      <p>
                        <CalendarDays size={16} />
                        {dateLabel(date)}
                      </p>
                      <p>
                        <Clock3 size={16} />
                        {time}
                      </p>
                    </div>
                    <Button variant="teal" onClick={book} loading={busy}>
                      Confirmar solicitud <Check size={16} />
                    </Button>
                    <Button variant="secondary" disabled={busy} onClick={() => setReview(false)}>
                      Modificar
                    </Button>
                  </div>
                )}
                {current?.step === 'booked' && current.appointment && !review && !reschedule && (
                  <div className="chat-option-card appointment-confirmation">
                    <span className="confirmation-icon">
                      {current.appointment.status === 'confirmed' ? (
                        <Check size={28} />
                      ) : (
                        <CalendarDays size={28} />
                      )}
                    </span>
                    <h3>
                      {current.appointment.status === 'cancelled'
                        ? 'Cita cancelada'
                        : current.appointment.status === 'confirmed'
                          ? 'Cita confirmada'
                          : 'Solicitud registrada'}
                    </h3>
                    <Badge status={current.appointment.status} />
                    <div className="chat-summary">
                      <p>
                        <UserRound size={16} />
                        {current.name}
                      </p>
                      <p>
                        <FileText size={16} />
                        {current.appointment.service}
                      </p>
                      <p>
                        <CalendarDays size={16} />
                        {dateLabel(current.appointment.startsAt)}
                      </p>
                      <p>
                        <Clock3 size={16} />
                        {timeLabel(current.appointment.startsAt)}
                      </p>
                    </div>
                    {current.appointment.status !== 'cancelled' && (
                      <>
                        <small>
                          Podrás consultar aquí la confirmación y los recordatorios de tu cita.
                        </small>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setReschedule(true);
                            setTime('');
                          }}
                        >
                          <RefreshCw size={15} /> Reprogramar
                        </Button>
                        <Button variant="ghost" onClick={() => setCancel(true)}>
                          Cancelar mi cita
                        </Button>
                      </>
                    )}
                    <Button variant="secondary" onClick={start} loading={busy}>
                      Agendar otra cita
                    </Button>
                  </div>
                )}
              </>
            )}
            {(error || session.error) && <Alert>{error || session.error?.message}</Alert>}
            {session.error && (
              <Button onClick={start} variant="secondary">
                Iniciar conversación
              </Button>
            )}
            {busy && (
              <div className="typing-indicator" aria-label="Procesando">
                <i />
                <i />
                <i />
              </div>
            )}
            <div ref={end} />
          </div>
          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
          >
            <Smile size={20} aria-hidden="true" />
            <input
              aria-label="Mensaje a Praxia"
              type={current?.step === 'phone' ? 'tel' : 'text'}
              placeholder={
                current?.step === 'name'
                  ? 'Escribe tu nombre completo...'
                  : current?.step === 'phone'
                    ? 'Escribe tu teléfono...'
                    : 'Escribe un mensaje...'
              }
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={menu || !current || current.step === 'service' || current.step === 'date'}
              maxLength={1000}
            />
            <Button
              variant="teal"
              aria-label="Enviar mensaje"
              disabled={busy || !draft.trim() || menu}
              loading={busy}
              type="submit"
            >
              <Send size={18} />
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
      <ConfirmDialog
        open={cancel}
        onClose={() => setCancel(false)}
        title="¿Cancelar tu cita?"
        message="El horario quedará disponible. Puedes agendar una nueva cita cuando lo necesites."
        loading={busy}
        onConfirm={async () => {
          if (!current?.appointment) return;
          setBusy(true);
          try {
            apply(await api.publicStatus(id, 'cancelled', current.appointment.id));
            await refresh();
            setCancel(false);
          } catch (err) {
            setError((err as Error).message);
            setCancel(false);
          } finally {
            setBusy(false);
          }
        }}
      />
    </Dialog.Root>
  );
}
