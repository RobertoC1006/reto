import type {
  Appointment,
  Conversation,
  Lead,
  Message,
  PublicSession,
  Settings,
} from '../shared/types';
import { addDays, dateKey, services, today } from '../shared/utils';
export interface Database {
  leads: Lead[];
  appointments: Appointment[];
  conversations: Conversation[];
  sessions: PublicSession[];
  settings: Settings;
  processed: Record<string, string>;
}
const key = 'praxia:database:v1';
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export const activity = (title: string) => ({ id: uid(), title, at: now() });
export const message = (
  text: string,
  direction: Message['direction'] = 'outbound',
  clientId?: string,
): Message => ({ id: uid(), text, direction, createdAt: now(), clientId });
export function seed(): Database {
  const names = [
    'Ana Torres',
    'Carlos Méndez',
    'Laura Gómez',
    'Miguel Ruiz',
    'Sofía Lima',
    'Jorge Castro',
    'Mariana Silva',
    'Valeria Rojas',
    'Diego Paredes',
    'Lucía Flores',
    'Mateo Salas',
    'Camila Vega',
  ];
  const leads: Lead[] = names.map((name, i) => ({
    id: `lead-${i + 1}`,
    name,
    phone: `+51 900 000 ${String(i + 1).padStart(3, '0')}`,
    email: `${name.split(' ')[0].toLowerCase()}@example.com`,
    origin: i % 3 ? 'WhatsApp' : 'Web',
    status: i < 8 ? 'converted' : i === 9 ? 'contacted' : 'new',
    notes: 'Prefiere la atención durante la mañana.',
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    history: [activity('Lead registrado')],
  }));
  const times = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '14:00',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
  ];
  const appointments: Appointment[] = times.map((time, i) => ({
    id: `apt-${i + 1}`,
    leadId: leads[i].id,
    service: services[i % services.length],
    startsAt: `${today()}T${time}:00-05:00`,
    status: i < 5 ? 'pending' : i < 9 ? 'confirmed' : i < 11 ? 'cancelled' : 'rescheduled',
    notes: '',
    history: [activity('Cita registrada')],
  }));
  appointments.push({
    id: 'apt-tomorrow',
    leadId: 'lead-1',
    service: services[0],
    startsAt: `${addDays(today(), 1)}T09:00:00-05:00`,
    status: 'pending',
    notes: '',
    history: [activity('Solicitud recibida por WhatsApp')],
  });
  const conversations: Conversation[] = leads
    .slice(0, 5)
    .map((lead, i) => ({
      id: `conv-${i + 1}`,
      leadId: lead.id,
      unread: i === 0 ? 1 : 0,
      messages: [
        message(
          [
            'Hola, ¿tienen citas disponibles para esta semana?',
            'Quisiera agendar una cita de control.',
            'Gracias por la información.',
            '¿Puedo cambiar el horario de mi cita?',
            'Hola, me gustaría una consulta general.',
          ][i],
          'inbound',
        ),
        ...(i === 0
          ? [message('¡Hola Ana! Sí, tenemos disponibilidad. ¿Qué horario te gustaría agendar?')]
          : []),
      ],
    }));
  return {
    leads,
    appointments,
    conversations,
    sessions: [],
    processed: {},
    settings: {
      clinicName: 'Praxia',
      phone: '+51 900 000 000',
      address: 'Av. Primavera 120, Lima',
      opensAt: '08:00',
      closesAt: '18:00',
      slotMinutes: 30,
      timezone: 'America/Lima',
    },
  };
}
export function readDB(): Database {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      /* Reset only malformed demo data. */
    }
  }
  const db = seed();
  writeDB(db);
  return db;
}
export function writeDB(db: Database) {
  localStorage.setItem(key, JSON.stringify(db));
}
export function summary(db: Database, from: string, to = from) {
  const appointments = db.appointments
    .filter((a) => dateKey(a.startsAt) >= from && dateKey(a.startsAt) <= to)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return {
    date: from,
    todayCount: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    rescheduled: appointments.filter((a) => a.status === 'rescheduled').length,
    totalLeads: db.leads.length,
    appointments,
    recentLeads: [...db.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
  };
}
