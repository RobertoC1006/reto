export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'rescheduled';
export type LeadStatus = 'new' | 'contacted' | 'converted' | 'inactive';
export interface Activity {
  id: string;
  title: string;
  at: string;
}
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  origin: 'WhatsApp' | 'Web' | 'Referido';
  status: LeadStatus;
  notes: string;
  createdAt: string;
  history: Activity[];
}
export interface Appointment {
  id: string;
  leadId: string;
  service: string;
  startsAt: string;
  status: AppointmentStatus;
  notes: string;
  history: Activity[];
}
export interface Message {
  id: string;
  text: string;
  direction: 'inbound' | 'outbound';
  createdAt: string;
  clientId?: string;
}
export interface Conversation {
  id: string;
  leadId: string;
  messages: Message[];
  unread: number;
}
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}
export interface Settings {
  clinicName: string;
  phone: string;
  address: string;
  opensAt: string;
  closesAt: string;
  slotMinutes: number;
  timezone: string;
}
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface Dashboard {
  date: string;
  todayCount: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  rescheduled: number;
  totalLeads: number;
  appointments: Appointment[];
  recentLeads: Lead[];
}
export interface PublicSession {
  id: string;
  leadId?: string;
  conversationId?: string;
  messages: Message[];
  step: 'name' | 'phone' | 'service' | 'date' | 'booked';
  name?: string;
  phone?: string;
  service?: string;
  appointment?: Appointment;
}
