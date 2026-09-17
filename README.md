# Mini Praxia

Frontend en React y TypeScript para una landing de consultorio con chat estilo WhatsApp y un sistema administrativo. Se conserva la identidad visual de los mockups: turquesa, celeste, blanco, tarjetas redondeadas y estados semánticos.

## Ejecutar

Requisitos: Node.js 22 y npm.

```sh
npm ci
npm run dev
```

Abrir `http://localhost:5173`. La landing está en `/` y el acceso administrativo en `/login`.

**Credenciales de demostración:** `admin@praxia.demo` / `Praxia2026!`.

No es necesario tener backend para recorrer la aplicación. MSW intercepta las peticiones HTTP y conserva datos ficticios en el almacenamiento local del navegador. Los datos se comparten entre las vistas públicas y administrativas del mismo origen; no se comparten entre dispositivos o perfiles de navegador.

## Funcionalidades

- Landing responsive con servicios, presentación, contacto y WhatsApp flotante.
- Chat guiado: nombre, teléfono, motivo, disponibilidad, resumen y reserva pendiente.
- Consulta de la última cita de la conversación, reprogramación y cancelación desde el chat.
- Login, recordar sesión, cierre de sesión y recuperación de acceso en modo demo.
- Dashboard con cinco indicadores, agenda, gráfico de estados y leads recientes.
- Leads/pacientes: búsqueda, filtros, paginación, alta, edición, estado e historial.
- Citas: tabla y calendario diario, creación, edición, confirmación, cancelación y reprogramación.
- Mensajes: simulación de recepción, asociación al lead, respuestas y recordatorios manuales.
- Reportes por período y exportación CSV.
- Configuración del consultorio y horario de atención.
- Formularios compartidos con validaciones, cargas, errores, reintentos, estados vacíos, confirmaciones y notificaciones.

WhatsApp es la experiencia visual solicitada; las comunicaciones son simuladas. El asistente usa un flujo determinista. No conecta con Meta ni con un proveedor de IA. La recuperación de contraseña no envía correo en modo demo, y los recordatorios se disparan manualmente.

## Conectar el backend

Crear `.env.local` usando `.env.example` como base:

```dotenv
VITE_API_BASE_URL=https://tu-backend.example/api
VITE_USE_MOCKS=false
```

Reiniciar Vite. En producción, estas variables deben estar disponibles durante el build.

1. Acordar el contrato descrito en `docs/API-CONTRACT.md`.
2. Ajustar las rutas en `src/shared/api/endpoints.ts`.
3. Adaptar payloads y respuestas en `src/shared/api/services.ts` si el contrato final difiere.
4. Configurar la sesión en `src/shared/api/client.ts`. Se propone cookie HttpOnly con `credentials: include`; backend debe autorizar el origen del frontend y las credenciales mediante CORS. El servidor debe proteger todos los recursos administrativos.
5. Probar con mocks desactivados: el frontend nunca recurre silenciosamente a datos ficticios cuando falla una API real.

La dirección de API es configuración pública. No se deben colocar claves privadas en variables `VITE_*`.

**Listo para integrar** significa que todas las operaciones de datos pasan por servicios HTTP centralizados. La integración real todavía requiere revisar los contratos, sesión y errores del backend; no está verificada con un servidor externo.

## Arquitectura

```text
src/app/                  Rutas, protección de sesión y arranque
src/layouts/              Estructura administrativa compartida
src/features/             Pantallas y componentes de cada función
src/shared/api/           Cliente HTTP, rutas y servicios tipados
src/shared/components/    Formularios, botones, tablas, modales y estados
src/shared/types.ts       Entidades del contrato
src/shared/utils.ts       Fechas de Lima, estados, formatos y servicios
src/styles/               Tokens y estilos responsive
src/mocks/                Backend de demostración aislado del producto
tests/                    Reglas de disponibilidad y recorridos de navegador
```

La UI consume servicios a través de TanStack Query. MSW simula la red sin bifurcaciones mock/real en las pantallas. Las mutaciones invalidan las consultas relacionadas; mensajes y chat se actualizan con polling mientras están activos. No se requiere WebSocket.

Se reutilizan `LeadForm` para alta/edición, `AppointmentForm` para creación/reprogramación, `DataTable` para listas, `Badge` para estados, `MessageBubble` para ambas experiencias de chat y `ConfirmDialog` para acciones que requieren confirmación. No hay una copia del HTML de cada mockup.

## Comprobar

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Las pruebas E2E recorren reserva pública → lead → cita → confirmación → recordatorio → reprogramación → cancelación, validaciones del servidor simulado, mensajes, reportes, configuración y navegación móvil. Generan capturas en `test-results/`, excluido de Git.

Para reiniciar **solo los datos de esta demo**, elimina las entradas `praxia:database:v1` y `praxia:public-session` del almacenamiento de este origen desde las herramientas del navegador. La siguiente visita vuelve a crear datos ficticios. Las citas iniciales se generan para el día de la primera visita.

## Despliegue

`npm run build` produce `dist/`. El hosting debe resolver las rutas de la SPA hacia `index.html`. Para una demo sin backend puede mantenerse `VITE_USE_MOCKS=true`; requiere HTTPS o localhost para el Service Worker. No se ha publicado automáticamente.

## Material visual

La fotografía `public/images/praxia-doctor.png` fue generada con ImageGen para esta implementación. Su prompt está en `docs/ASSETS.md`. No representa al personal real de un consultorio.

## Límites del prototipo

- Disponibilidad modelada como una sola agenda compartida del consultorio, con turnos configurables. Backend puede ampliar el contrato con profesionales y recursos.
- Hora de Lima (`America/Lima`) y fechas ISO; no hay selector multizona.
- El chat público conserva una sesión local y permite consultar solo la cita asociada a esa conversación. Una búsqueda de otras citas por identidad requiere una verificación de identidad definida por backend.
- Las listas se paginan; el selector de pacientes utiliza un directorio de hasta 100 registros de la API. Para volúmenes mayores, conviene acordar un selector con búsqueda remota.
- El asistente procesa texto y botones; audio, adjuntos y llamadas no forman parte del flujo implementado.
- La protección del mock es exclusivamente de demostración; la autorización definitiva pertenece al backend.

## Explicación para la demo

1. Abrir la landing y reservar por WhatsApp con un paciente ficticio.
2. Entrar al sistema y buscar ese paciente.
3. Abrir su cita, confirmarla y enviar un recordatorio.
4. Mostrar la conversación, el dashboard y los cambios de estado.
5. Intentar una cita duplicada o un horario fuera de atención.
6. Explicar los componentes compartidos, servicios HTTP y la sustitución de MSW por backend.
