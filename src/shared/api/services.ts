import { json, request } from './client';
import { endpoints as e } from './endpoints';
import type {
  Appointment,
  AppointmentStatus,
  Conversation,
  Dashboard,
  Lead,
  Page,
  PublicSession,
  Settings,
  User,
} from '../types';
const query = (params: Record<string, string | number | undefined>) =>
  '?' +
  new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  );
export const api = {
  me: () => request<User>(e.me),
  login: (data: { email: string; password: string; remember: boolean }) =>
    request<User>(e.login, json('POST', data)),
  logout: () => request<null>(e.logout, json('POST')),
  recover: (email: string) => request<null>(e.recover, json('POST', { email })),
  dashboard: (date: string) => request<Dashboard>(e.dashboard + query({ date })),
  leads: (params: Record<string, string | number | undefined> = {}) =>
    request<Page<Lead>>(e.leads + query(params)),
  lead: (id: string) => request<Lead>(`${e.leads}/${id}`),
  saveLead: (data: Partial<Lead>, id?: string) =>
    request<Lead>(e.leads + (id ? `/${id}` : ''), json(id ? 'PATCH' : 'POST', data)),
  appointments: (params: Record<string, string | number | undefined> = {}) =>
    request<Page<Appointment>>(e.appointments + query(params)),
  appointment: (id: string) => request<Appointment>(`${e.appointments}/${id}`),
  saveAppointment: (data: Partial<Appointment>, id?: string) =>
    request<Appointment>(e.appointments + (id ? `/${id}` : ''), json(id ? 'PATCH' : 'POST', data)),
  status: (id: string, status: AppointmentStatus) =>
    request<Appointment>(`${e.appointments}/${id}/status`, json('PATCH', { status })),
  availability: (date: string, excludeId?: string) =>
    request<string[]>(e.availability + query({ date, excludeId })),
  reminder: (id: string) => request<null>(`${e.appointments}/${id}/reminder`, json('POST')),
  conversations: () => request<Conversation[]>(e.conversations),
  sendMessage: (id: string, text: string, clientId: string) =>
    request<Conversation>(`${e.conversations}/${id}/messages`, json('POST', { text, clientId })),
  simulate: (data: { name: string; phone: string; text: string; clientId: string }) =>
    request<Conversation>(e.simulations, json('POST', data)),
  settings: () => request<Settings>(e.settings),
  publicSettings: () => request<Settings>(e.publicSettings),
  saveSettings: (data: Settings) => request<Settings>(e.settings, json('PATCH', data)),
  reports: (from: string, to: string) => request<Dashboard>(e.reports + query({ from, to })),
  startSession: () => request<PublicSession>(e.publicSessions, json('POST')),
  session: (id: string) => request<PublicSession>(`${e.publicSessions}/${id}`),
  publicMessage: (id: string, text: string, clientId: string) =>
    request<PublicSession>(`${e.publicSessions}/${id}/messages`, json('POST', { text, clientId })),
  publicBook: (id: string, startsAt: string, clientId: string) =>
    request<PublicSession>(
      `${e.publicSessions}/${id}/appointment`,
      json('POST', { startsAt, clientId }),
    ),
  publicStatus: (id: string, status: 'cancelled', appointmentId: string) =>
    request<PublicSession>(
      `${e.publicSessions}/${id}/appointment/status`,
      json('PATCH', { status, appointmentId }),
    ),
};
