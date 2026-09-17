# Contrato provisional de API

Este es el contrato que consume el frontend, no una afirmación sobre endpoints existentes. Base: `VITE_API_BASE_URL`, por defecto `/api`. Rutas centralizadas en `src/shared/api/endpoints.ts`; serialización en `src/shared/api/services.ts`.

## Convenciones

- Éxito JSON: `{ "data": T }`. Las operaciones sin resultado aceptan `{ "data": null }` o HTTP 204.
- Error: `{ "code": "SLOT_UNAVAILABLE", "message": "Ese horario acaba de ocuparse.", "fieldErrors": { "time": "Elige otro horario." } }`.
- Colecciones paginadas dentro de `data`: `{ "items": [], "page": 1, "pageSize": 6, "total": 12, "totalPages": 2 }`.
- IDs opacos de tipo string. No se extrae información de su formato.
- Timestamps ISO 8601 con offset o UTC. La UI muestra la zona `America/Lima`. Fechas de filtros: `YYYY-MM-DD`. Horas disponibles: `HH:mm`.
- Una cita dura `slotMinutes`; su fin debe estar dentro del horario. Backend valida disponibilidad de forma atómica y devuelve 409 si otro usuario ocupó el turno.
- El estado de la respuesta del servidor es definitivo; la UI no confirma reservas antes de recibir éxito.
- La agenda y los indicadores comparten los mismos filtros de día/período. `todayCount` incluye todos los estados y coincide con su suma.

## Modelos

Las interfaces completas están en `src/shared/types.ts`.

```ts
type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'rescheduled';
type LeadStatus = 'new' | 'contacted' | 'converted' | 'inactive';
type Origin = 'WhatsApp' | 'Web' | 'Referido';

interface Activity { id: string; title: string; at: string }
interface Lead {
  id: string; name: string; phone: string; email: string;
  origin: Origin; status: LeadStatus; notes: string;
  createdAt: string; history: Activity[];
}
interface Appointment {
  id: string; leadId: string; service: string; startsAt: string;
  status: AppointmentStatus; notes: string; history: Activity[];
}
interface Message {
  id: string; text: string; direction: 'inbound' | 'outbound';
  createdAt: string; clientId?: string;
}
interface Conversation {
  id: string; leadId: string; messages: Message[]; unread: number;
}
```

## Autenticación administrativa

| Método y ruta | Entrada | `data` |
|---|---|---|
| POST `/auth/login` | `{ email, password, remember }` | `{ id, name, email, role }` |
| GET `/auth/me` | — | Usuario actual |
| POST `/auth/logout` | — | `null` |
| POST `/auth/recover` | `{ email }` | `null` |

Cookie de sesión HttpOnly propuesta. `remember` controla la duración del lado del servidor. Las rutas `/app` tienen un guard visual, pero backend debe autenticar y autorizar cada recurso. Un 401 en una operación administrativa hace que la UI vuelva a login. Credenciales demo solo en MSW.

## Leads

| Método y ruta | Entrada | `data` |
|---|---|---|
| GET `/leads` | Query `q`, `status`, `origin`, `page`, `pageSize` | Página de Lead |
| GET `/leads/:id` | — | Lead |
| POST `/leads` | `{ name, phone, email, origin, notes }` | Lead creado |
| PATCH `/leads/:id` | Campos modificados, incluido `status` | Lead actualizado |

Normalizar teléfono para detectar duplicados. Backend asigna `id`, `createdAt` e historial. Un error de campo utiliza las claves `name`, `phone`, `email`, `origin`, `notes`.

## Citas

| Método y ruta | Entrada | `data` |
|---|---|---|
| GET `/appointments` | Query `date`, `status`, `leadId`, `page`, `pageSize` | Página de Appointment |
| GET `/appointments/:id` | — | Appointment |
| POST `/appointments` | `{ leadId, service, startsAt, status, notes }` | Appointment |
| PATCH `/appointments/:id` | Mismos campos modificados | Appointment |
| PATCH `/appointments/:id/status` | `{ status: 'confirmed' \| 'cancelled' }` | Appointment |
| GET `/appointments/availability` | Query `date`, `excludeId?` | `string[]`, por ejemplo `["09:00", "09:30"]` |
| POST `/appointments/:id/reminder` | — | `null`; crea mensaje y actividad |

Una creación pública comienza en `pending`. Al modificar la fecha/hora se cambia a `rescheduled` y se registra el evento. Una cita pendiente o reprogramada puede confirmarse; una activa puede cancelarse. Una cancelada no se reactiva mediante cambio de estado: se crea una nueva reserva.

Errores: `DUPLICATE_APPOINTMENT`, `SLOT_UNAVAILABLE`, `INVALID_TIME_SLOT`, `PAST_DATE`, `INVALID_TRANSITION`. Código 409 para conflictos; 422 para entrada inválida. La UI muestra errores de hora junto al campo `time`.

Disponibilidad puede exponerse públicamente, devolviendo únicamente horarios libres. El resto de los recursos administrativos requiere sesión.

## Dashboard y reportes

| Método y ruta | Query | `data` |
|---|---|---|
| GET `/dashboard/today` | `date=YYYY-MM-DD` | Resumen |
| GET `/reports` | `from=YYYY-MM-DD&to=YYYY-MM-DD` | Resumen del período |

```ts
interface Dashboard {
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
```

`totalLeads` es total registrado, sin filtro temporal. Los otros contadores y citas pertenecen al día/período consultado. No enviar métricas independientes con valores divergentes.

## Conversaciones administrativas

| Método y ruta | Entrada | `data` |
|---|---|---|
| GET `/conversations` | — | Conversation[] |
| POST `/conversations/:id/messages` | `{ text, clientId }` | Conversation actualizada |
| POST `/whatsapp/simulations` | `{ name, phone, text, clientId }` | Conversation con lead asociado |

Los mensajes de paciente tienen `direction: inbound`; respuestas de recepción, asistente y recordatorios, `outbound`. Se comparte esta convención en ambas vistas.

`clientId` permite deduplicar reintentos. En el envío normal, repetirlo devuelve el resultado ya creado. El simulador puede devolver `DUPLICATE_MESSAGE` (409) para demostrar el caso de mensaje repetido.

## Chat público (sesión aislada)

El frontend no utiliza credenciales administrativas en el chat público. El ID de sesión es un identificador opaco con alta entropía y queda en `sessionStorage`. El backend debe tratarlo como una capacidad temporal, limitarlo a su propia conversación y aplicar expiración. Consultar citas ajenas por teléfono no está permitido por este contrato.

| Método y ruta | Entrada | `data` |
|---|---|---|
| POST `/public/sessions` | — | PublicSession |
| GET `/public/sessions/:id` | — | PublicSession actualizada |
| POST `/public/sessions/:id/messages` | `{ text, clientId }` | PublicSession |
| POST `/public/sessions/:id/appointment` | `{ startsAt, clientId }` | PublicSession con cita |
| PATCH `/public/sessions/:id/appointment/status` | `{ status: 'cancelled', appointmentId }` | PublicSession |

```ts
interface PublicSession {
  id: string;
  step: 'name' | 'phone' | 'service' | 'date' | 'booked';
  messages: Message[];
  leadId?: string;
  conversationId?: string;
  name?: string;
  phone?: string;
  service?: string;
  appointment?: Appointment;
}
```

El servidor conduce el flujo: recibe nombre, teléfono y motivo, crea/asocia el lead y expone los horarios. El botón de confirmar solicita una cita; si ya existe una cita activa en la sesión, el mismo endpoint reprograma. Una nueva sesión permite otra reserva. No se necesitan llamadas a una IA desde el navegador.

Mensajes y citas son entidades compartidas: una respuesta administrativa o un recordatorio debe aparecer en el GET de la sesión pública. El frontend consulta cada 4 segundos cuando la conversación está abierta. Mantener idempotencia de `clientId` al reservar para no crear duplicados con reintentos.

## Configuración

| Método y ruta | Entrada | `data` |
|---|---|---|
| GET `/settings` | — | Settings |
| PATCH `/settings` | Settings | Settings actualizada |
| GET `/public/settings` | — | Datos públicos del consultorio |

```ts
interface Settings {
  clinicName: string; phone: string; address: string;
  opensAt: string; closesAt: string;
  slotMinutes: number; timezone: string;
}
```

El prototipo acepta 15, 30 o 60 minutos por turno y opera con `America/Lima`.

## Integración final

Si backend usa otros nombres (`patient_id`, `scheduled_at`, estados en español...), convertirlos en los servicios o crear mappers junto a ellos. Los componentes reciben el modelo de UI y no conocen el formato remoto. Si se usa token en vez de cookie, incorporar un adaptador de sesión al cliente HTTP. Revisar también el endpoint de recuperación de contraseña: en demo no envía correos.
