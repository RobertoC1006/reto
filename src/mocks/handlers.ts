import { http, HttpResponse, delay } from 'msw';
import { API_BASE } from '../shared/api/client';
import { endpoints as e } from '../shared/api/endpoints';
import { dateKey, dateLabel, services, timeLabel, today } from '../shared/utils';
import type { Appointment, Conversation, Lead, PublicSession, User } from '../shared/types';
import { activity, message, now, readDB, summary, uid, writeDB } from './database';
import { availableSlots, slotErrors, validateSlot } from './rules';
const user: User = {
  id: 'admin-1',
  name: 'Roberto',
  email: 'admin@praxia.demo',
  role: 'Administrador',
};
const ok = (data: unknown) => HttpResponse.json({ data });
const error = (code: string, msg: string, status = 422, fieldErrors?: Record<string, string>) =>
  HttpResponse.json({ code, message: msg, fieldErrors }, { status });
const authorized = () =>
  sessionStorage.getItem('praxia:auth') || localStorage.getItem('praxia:auth');
function paginate<T>(items: T[], url: URL) {
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 6));
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: items.length,
    totalPages: Math.ceil(items.length / pageSize),
  };
}
type Context = { request: Request; params: Record<string, string | readonly string[] | undefined> };
function handler(
  method: 'get' | 'post' | 'patch',
  path: string,
  fn: (ctx: Context) => Promise<Response> | Response,
  isPublic = false,
) {
  return http[method](`${API_BASE}${path}`, async (ctx) => {
    await delay(180);
    if (!isPublic && !authorized())
      return error('UNAUTHORIZED', 'Inicia sesión para continuar.', 401);
    try {
      return await fn(ctx);
    } catch {
      return error(
        'INTERNAL_ERROR',
        'No pudimos completar la operación. Vuelve a intentarlo.',
        500,
      );
    }
  });
}
export const handlers = [
  handler(
    'post',
    e.login,
    async ({ request }) => {
      const data = await request.json();
      if (data.email !== user.email || data.password !== 'Praxia2026!')
        return error('INVALID_CREDENTIALS', 'El correo o la contraseña no son correctos.', 401);
      (data.remember ? localStorage : sessionStorage).setItem('praxia:auth', 'demo-session');
      return ok(user);
    },
    true,
  ),
  handler('get', e.me, () => ok(user)),
  handler('post', e.logout, () => {
    localStorage.removeItem('praxia:auth');
    sessionStorage.removeItem('praxia:auth');
    return ok(null);
  }),
  handler(
    'post',
    e.recover,
    () => ok({ message: 'En esta demo utiliza admin@praxia.demo y Praxia2026!.' }),
    true,
  ),
  handler('get', e.dashboard, ({ request }) =>
    ok(summary(readDB(), new URL(request.url).searchParams.get('date') || today())),
  ),
  handler('get', e.reports, ({ request }) => {
    const url = new URL(request.url);
    return ok(
      summary(
        readDB(),
        url.searchParams.get('from') || today(),
        url.searchParams.get('to') || today(),
      ),
    );
  }),
  handler('get', e.leads, ({ request }) => {
    const url = new URL(request.url),
      q = (url.searchParams.get('q') || '').toLowerCase(),
      status = url.searchParams.get('status'),
      origin = url.searchParams.get('origin');
    const items = readDB().leads.filter(
      (l) =>
        `${l.name} ${l.phone} ${l.email}`.toLowerCase().includes(q) &&
        (!status || l.status === status) &&
        (!origin || l.origin === origin),
    );
    return ok(
      paginate(
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        url,
      ),
    );
  }),
  handler('get', `${e.leads}/:id`, ({ params }) => {
    const lead = readDB().leads.find((l) => l.id === params.id);
    return lead ? ok(lead) : error('NOT_FOUND', 'No encontramos a este paciente.', 404);
  }),
  ...(['post', 'patch'] as const).map((method) =>
    handler(method, e.leads + (method === 'patch' ? '/:id' : ''), async ({ request, params }) => {
      const db = readDB(),
        data = await request.json(),
        existing = db.leads.find((l) => l.id === params.id);
      if (method === 'patch' && !existing)
        return error('NOT_FOUND', 'Paciente no encontrado.', 404);
      const merged = { ...existing, ...data };
      if (!merged.name?.trim() || !/^\+?[\d\s()-]{7,20}$/.test(merged.phone || ''))
        return error('VALIDATION_ERROR', 'Revisa los datos del paciente.', 422, {
          name: !merged.name?.trim() ? 'Escribe el nombre.' : '',
          phone: 'Introduce un teléfono válido.',
        });
      if (
        db.leads.some(
          (l) =>
            l.id !== existing?.id && l.phone.replace(/\D/g, '') === merged.phone.replace(/\D/g, ''),
        )
      )
        return error('DUPLICATE_LEAD', 'Ya existe un paciente con ese teléfono.', 409, {
          phone: 'Este teléfono ya está registrado.',
        });
      const lead: Lead = {
        id: uid(),
        name: '',
        phone: '',
        email: '',
        notes: '',
        status: 'new',
        origin: 'Web',
        createdAt: now(),
        history: [],
        ...existing,
        ...data,
      };
      lead.history = [
        ...(existing?.history || []),
        activity(existing ? 'Datos del paciente actualizados' : 'Lead registrado'),
      ];
      db.leads = existing
        ? db.leads.map((l) => (l.id === existing.id ? lead : l))
        : [lead, ...db.leads];
      writeDB(db);
      return ok(lead);
    }),
  ),
  handler(
    'get',
    e.availability,
    ({ request }) => {
      const url = new URL(request.url),
        db = readDB();
      return ok(
        availableSlots(
          url.searchParams.get('date') || today(),
          db.appointments,
          db.settings,
          url.searchParams.get('excludeId') || undefined,
        ),
      );
    },
    true,
  ),
  handler('get', e.appointments, ({ request }) => {
    const url = new URL(request.url),
      db = readDB(),
      date = url.searchParams.get('date'),
      status = url.searchParams.get('status'),
      leadId = url.searchParams.get('leadId');
    return ok(
      paginate(
        db.appointments
          .filter(
            (a) =>
              (!date || dateKey(a.startsAt) === date) &&
              (!status || a.status === status) &&
              (!leadId || a.leadId === leadId),
          )
          .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
        url,
      ),
    );
  }),
  handler('get', `${e.appointments}/:id`, ({ params }) => {
    const apt = readDB().appointments.find((a) => a.id === params.id);
    return apt ? ok(apt) : error('NOT_FOUND', 'No encontramos esta cita.', 404);
  }),
  ...(['post', 'patch'] as const).map((method) =>
    handler(
      method,
      e.appointments + (method === 'patch' ? '/:id' : ''),
      async ({ request, params }) => {
        const db = readDB(),
          data = await request.json(),
          existing = db.appointments.find((a) => a.id === params.id);
        if (method === 'patch' && !existing) return error('NOT_FOUND', 'Cita no encontrada.', 404);
        const merged = { ...existing, ...data };
        if (!db.leads.some((l) => l.id === merged.leadId) || !services.includes(merged.service))
          return error('VALIDATION_ERROR', 'Selecciona un paciente y un motivo válidos.');
        const problem = validateSlot(
          merged.startsAt,
          db.appointments,
          db.settings,
          merged.leadId,
          existing?.id,
        );
        if (problem) return error(problem, slotErrors[problem], 409, { time: slotErrors[problem] });
        const rescheduled =
          !!existing &&
          new Date(existing.startsAt).getTime() !== new Date(merged.startsAt).getTime();
        const apt: Appointment = {
          id: uid(),
          notes: '',
          status: 'pending',
          ...existing,
          ...data,
          history: [
            ...(existing?.history || []),
            activity(
              rescheduled
                ? `Reprogramada: ${dateLabel(merged.startsAt)} · ${timeLabel(merged.startsAt)}`
                : existing
                  ? 'Cita actualizada'
                  : 'Cita registrada',
            ),
          ],
        };
        if (rescheduled) apt.status = 'rescheduled';
        db.appointments = existing
          ? db.appointments.map((a) => (a.id === existing.id ? apt : a))
          : [...db.appointments, apt];
        const lead = db.leads.find((l) => l.id === apt.leadId)!;
        lead.status = 'converted';
        lead.history.push(activity('Cita asociada al paciente'));
        writeDB(db);
        return ok(apt);
      },
    ),
  ),
  handler('patch', `${e.appointments}/:id/status`, async ({ request, params }) => {
    const db = readDB(),
      { status } = await request.json(),
      apt = db.appointments.find((a) => a.id === params.id);
    if (!apt) return error('NOT_FOUND', 'Cita no encontrada.', 404);
    if (!['confirmed', 'cancelled'].includes(status) || apt.status === 'cancelled')
      return error('INVALID_TRANSITION', 'Esta cita no admite ese cambio de estado.', 409);
    apt.status = status;
    apt.history.push(
      activity(
        status === 'confirmed' ? 'Cita confirmada por recepción' : 'Cita cancelada por recepción',
      ),
    );
    writeDB(db);
    return ok(apt);
  }),
  handler('post', `${e.appointments}/:id/reminder`, ({ params }) => {
    const db = readDB(),
      apt = db.appointments.find((a) => a.id === params.id);
    if (!apt || apt.status === 'cancelled')
      return error('INVALID_APPOINTMENT', 'Solo puedes recordar citas activas.');
    let conv = db.conversations.find((c) => c.leadId === apt.leadId);
    if (!conv) {
      conv = { id: uid(), leadId: apt.leadId, unread: 0, messages: [] };
      db.conversations.push(conv);
    }
    conv.messages.push(
      message(
        `Te recordamos tu cita de ${apt.service} el ${dateLabel(apt.startsAt)} a las ${timeLabel(apt.startsAt)}. Te esperamos en Praxia.`,
      ),
    );
    apt.history.push(activity('Recordatorio enviado por WhatsApp (simulación)'));
    writeDB(db);
    return ok(null);
  }),
  handler('get', e.conversations, () => ok(readDB().conversations)),
  handler('post', `${e.conversations}/:id/messages`, async ({ request, params }) => {
    const db = readDB(),
      data = await request.json(),
      conv = db.conversations.find((c) => c.id === params.id);
    if (!conv) return error('NOT_FOUND', 'Conversación no encontrada.', 404);
    if (!data.text?.trim()) return error('VALIDATION_ERROR', 'Escribe un mensaje.');
    if (!conv.messages.some((m) => m.clientId === data.clientId))
      conv.messages.push(message(data.text.trim(), 'outbound', data.clientId));
    writeDB(db);
    return ok(conv);
  }),
  handler('post', e.simulations, async ({ request }) => {
    const db = readDB(),
      data = await request.json();
    if (db.processed[data.clientId])
      return error('DUPLICATE_MESSAGE', 'Este mensaje ya fue procesado.', 409);
    if (!data.name?.trim() || !data.phone?.trim() || !data.text?.trim())
      return error('VALIDATION_ERROR', 'Completa nombre, teléfono y mensaje.');
    let lead = db.leads.find((l) => l.phone.replace(/\D/g, '') === data.phone.replace(/\D/g, ''));
    if (!lead) {
      lead = {
        id: uid(),
        name: data.name,
        phone: data.phone,
        email: '',
        notes: '',
        origin: 'WhatsApp',
        status: 'new',
        createdAt: now(),
        history: [activity('Lead creado desde WhatsApp')],
      };
      db.leads.unshift(lead);
    }
    let conv = db.conversations.find((c) => c.leadId === lead.id);
    if (!conv) {
      conv = { id: uid(), leadId: lead.id, messages: [], unread: 0 };
      db.conversations.unshift(conv);
    }
    conv.messages.push(message(data.text, 'inbound', data.clientId));
    conv.unread++;
    db.processed[data.clientId] = conv.id;
    writeDB(db);
    return ok(conv);
  }),
  handler('get', e.settings, () => ok(readDB().settings)),
  handler('get', e.publicSettings, () => ok(readDB().settings), true),
  handler('patch', e.settings, async ({ request }) => {
    const db = readDB(),
      data = await request.json();
    if (
      !data.clinicName ||
      data.opensAt >= data.closesAt ||
      ![15, 30, 60].includes(data.slotMinutes)
    )
      return error('VALIDATION_ERROR', 'Revisa el nombre y el horario de atención.');
    db.settings = { ...db.settings, ...data };
    writeDB(db);
    return ok(db.settings);
  }),
  handler(
    'post',
    e.publicSessions,
    () => {
      const db = readDB();
      const session: PublicSession = {
        id: uid(),
        messages: [
          message(
            '¡Hola! Soy el asistente de Praxia. Te ayudaré a agendar tu cita de forma rápida y sencilla. ¿Cuál es tu nombre completo?',
          ),
        ],
        step: 'name',
      };
      db.sessions.push(session);
      writeDB(db);
      return ok(session);
    },
    true,
  ),
  handler(
    'get',
    `${e.publicSessions}/:id`,
    ({ params }) => {
      const db = readDB(),
        session = db.sessions.find((s) => s.id === params.id);
      if (!session)
        return error('NOT_FOUND', 'La conversación ha terminado. Inicia una nueva.', 404);
      const conv = db.conversations.find((c) => c.id === session.conversationId);
      if (conv) session.messages = conv.messages;
      if (session.appointment)
        session.appointment = db.appointments.find((a) => a.id === session.appointment!.id);
      return ok(session);
    },
    true,
  ),
  handler(
    'post',
    `${e.publicSessions}/:id/messages`,
    async ({ request, params }) => {
      const db = readDB(),
        data = await request.json(),
        session = db.sessions.find((s) => s.id === params.id);
      if (!session) return error('NOT_FOUND', 'Vuelve a iniciar la conversación.', 404);
      const existingConversation = db.conversations.find((c) => c.id === session.conversationId);
      if (existingConversation) session.messages = existingConversation.messages;
      if (session.messages.some((m) => m.clientId === data.clientId)) return ok(session);
      const text = String(data.text || '').trim();
      if (!text) return error('VALIDATION_ERROR', 'Escribe una respuesta.');
      if (session.step === 'phone' && !/^\+?[\d\s()-]{7,20}$/.test(text))
        return error(
          'VALIDATION_ERROR',
          'Escribe un teléfono válido, por ejemplo +51 900 000 123.',
        );
      if (session.step === 'service' && !services.includes(text))
        return error('VALIDATION_ERROR', 'Elige uno de los motivos disponibles.');
      session.messages.push(message(text, 'inbound', data.clientId));
      if (session.step === 'name') {
        session.name = text;
        session.step = 'phone';
        session.messages.push(
          message(`Un gusto, ${text.split(' ')[0]}. ¿Cuál es tu número de teléfono?`),
        );
      } else if (session.step === 'phone') {
        session.phone = text;
        session.step = 'service';
        let lead = db.leads.find((l) => l.phone.replace(/\D/g, '') === text.replace(/\D/g, ''));
        if (!lead) {
          lead = {
            id: uid(),
            name: session.name!,
            phone: text,
            email: '',
            origin: 'WhatsApp',
            status: 'new',
            notes: '',
            createdAt: now(),
            history: [activity('Lead creado desde WhatsApp')],
          };
          db.leads.unshift(lead);
        }
        session.leadId = lead.id;
        session.messages.push(message('¿Cuál es el motivo de tu consulta?'));
        const conv: Conversation = {
          id: uid(),
          leadId: lead.id,
          messages: session.messages,
          unread: 1,
        };
        db.conversations.unshift(conv);
        session.conversationId = conv.id;
      } else if (session.step === 'service') {
        session.service = text;
        session.step = 'date';
        session.messages.push(
          message('Perfecto. Elige la fecha y uno de los horarios disponibles.'),
        );
      } else
        session.messages.push(
          message(
            'Tu mensaje llegó a recepción. Puedes gestionar tu cita desde la tarjeta de esta conversación.',
          ),
        );
      const conv = db.conversations.find((c) => c.id === session.conversationId);
      if (conv) conv.messages = session.messages;
      writeDB(db);
      return ok(session);
    },
    true,
  ),
  handler(
    'post',
    `${e.publicSessions}/:id/appointment`,
    async ({ request, params }) => {
      const db = readDB(),
        data = await request.json(),
        session = db.sessions.find((s) => s.id === params.id);
      if (!session?.leadId || !session.service)
        return error('VALIDATION_ERROR', 'Completa tus datos primero.');
      const existingConversation = db.conversations.find((c) => c.id === session.conversationId);
      if (existingConversation) session.messages = existingConversation.messages;
      if (db.processed[data.clientId]) return ok(session);
      const existing = session.appointment
        ? db.appointments.find((a) => a.id === session.appointment!.id)
        : undefined;
      if (existing?.status === 'cancelled')
        return error(
          'INVALID_TRANSITION',
          'Inicia una nueva solicitud para reservar otra cita.',
          409,
        );
      const problem = validateSlot(
        data.startsAt,
        db.appointments,
        db.settings,
        session.leadId,
        existing?.id,
      );
      if (problem) return error(problem, slotErrors[problem], 409);
      const apt: Appointment = existing || {
        id: uid(),
        leadId: session.leadId,
        service: session.service,
        startsAt: data.startsAt,
        status: 'pending',
        notes: '',
        history: [],
      };
      apt.startsAt = data.startsAt;
      apt.status = existing ? 'rescheduled' : 'pending';
      apt.history.push(
        activity(existing ? 'Reprogramada desde WhatsApp' : 'Solicitud recibida desde WhatsApp'),
      );
      if (!existing) db.appointments.push(apt);
      session.appointment = apt;
      session.step = 'booked';
      session.messages.push(
        message(
          `Tu cita para el ${dateLabel(apt.startsAt)} a las ${timeLabel(apt.startsAt)} fue ${existing ? 'reprogramada' : 'registrada'}. Recepción confirmará tu solicitud.`,
        ),
      );
      const lead = db.leads.find((l) => l.id === session.leadId)!;
      lead.status = 'converted';
      lead.history.push(activity('Cita solicitada por WhatsApp'));
      const conv = db.conversations.find((c) => c.id === session.conversationId);
      if (conv) conv.messages = session.messages;
      db.processed[data.clientId] = apt.id;
      writeDB(db);
      return ok(session);
    },
    true,
  ),
  handler(
    'patch',
    `${e.publicSessions}/:id/appointment/status`,
    async ({ request, params }) => {
      const db = readDB(),
        data = await request.json(),
        session = db.sessions.find((s) => s.id === params.id),
        apt = session?.appointment && db.appointments.find((a) => a.id === session.appointment!.id);
      if (!session || !apt || apt.id !== data.appointmentId || data.status !== 'cancelled')
        return error('INVALID_REQUEST', 'No se puede modificar esta cita.', 403);
      const existingConversation = db.conversations.find((c) => c.id === session.conversationId);
      if (existingConversation) session.messages = existingConversation.messages;
      apt.status = 'cancelled';
      apt.history.push(activity('Cancelada desde WhatsApp'));
      session.appointment = apt;
      session.messages.push(
        message(
          'Tu cita ha sido cancelada. Cuando lo necesites, puedes iniciar una nueva solicitud.',
        ),
      );
      const conv = db.conversations.find((c) => c.id === session.conversationId);
      if (conv) conv.messages = session.messages;
      writeDB(db);
      return ok(session);
    },
    true,
  ),
];
