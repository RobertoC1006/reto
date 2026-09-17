import { expect, test, type Page } from '@playwright/test';
async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill('admin@praxia.demo');
  await page.getByLabel('Contraseña', { exact: true }).fill('Praxia2026!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Dr. Roberto' })).toBeVisible();
}
test('reserva pública → lead → cita → confirmación → recordatorio → reprogramación → cancelación', async ({
  page,
}) => {
  const faults: string[] = [];
  page.on('pageerror', (e) => faults.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tu salud, nuestra prioridad.' })).toBeVisible();
  await page.screenshot({ path: 'test-results/landing-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Abrir chat de WhatsApp' }).click();
  await page.getByRole('button', { name: 'Agendar una cita', exact: true }).click();
  await expect(page.getByPlaceholder('Escribe tu nombre completo...')).toBeEnabled();
  await page.getByLabel('Mensaje a Praxia').fill('Andrea Prueba');
  await page.getByRole('button', { name: 'Enviar mensaje', exact: true }).click();
  await expect(page.getByPlaceholder('Escribe tu teléfono...')).toBeEnabled();
  await page.getByLabel('Mensaje a Praxia').fill('+51 999 123 789');
  await page.getByRole('button', { name: 'Enviar mensaje', exact: true }).click();
  await page.getByRole('button', { name: 'Consulta general', exact: true }).click();
  await page.getByRole('button', { name: '09:30', exact: true }).click();
  await page.getByRole('button', { name: 'Revisar mi cita' }).click();
  await page.getByRole('button', { name: 'Confirmar solicitud' }).click();
  await expect(page.getByRole('heading', { name: 'Solicitud registrada' })).toBeVisible();
  await page.screenshot({ path: 'test-results/chat-desktop.png' });
  await page.getByRole('button', { name: 'Cerrar chat', exact: true }).click();
  await login(page);
  await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Leads / Pacientes', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Buscar por nombre, teléfono o email...' })
    .fill('Andrea Prueba');
  await page.getByRole('link', { name: 'Andrea Prueba', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Andrea Prueba' })).toBeVisible();
  await page.getByRole('tab', { name: 'Citas', exact: true }).click();
  await page.getByRole('link', { name: /Consulta general/ }).click();
  await page.getByRole('button', { name: 'Confirmar cita' }).click();
  await expect(
    page.locator('.profile-heading').getByText('Confirmada', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Enviar recordatorio' }).click();
  await expect(page.getByText('Recordatorio agregado a WhatsApp')).toBeVisible();
  await page.getByRole('link', { name: 'Reprogramar', exact: true }).click();
  await page.getByRole('button', { name: '10:00', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar cita' }).click();
  await expect(page.locator('.profile-heading').getByText('Reprogramada')).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar cita', exact: true }).click();
  await page.getByRole('button', { name: 'Sí, continuar' }).click();
  await expect(
    page.locator('.profile-heading').getByText('Cancelada', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator('.profile-heading').getByText('Cancelada', { exact: true }),
  ).toBeVisible();
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir chat de WhatsApp' }).click();
  await page.getByRole('button', { name: 'Consultar mis citas' }).click();
  await expect(page.getByRole('heading', { name: 'Cita cancelada' })).toBeVisible();
  expect(faults).toEqual([]);
});
test('administración: validación real, simulación, filtros, reportes y navegación', async ({
  page,
}) => {
  await login(page);
  await page.goto('/app/citas/nueva');
  await page.getByRole('button', { name: 'Guardar cita' }).click();
  await expect(page.getByText('Selecciona un paciente.', { exact: true })).toBeVisible();
  await page.getByLabel('Paciente / Lead').selectOption('lead-1');
  await page.getByLabel('Hora', { exact: true }).fill('07:30');
  await page.getByRole('button', { name: 'Guardar cita' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'fuera de atención' }).first(),
  ).toBeVisible();
  await page.getByLabel('Hora', { exact: true }).fill('09:00');
  await page.getByRole('button', { name: 'Guardar cita' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'ya tiene una cita' }).first(),
  ).toBeVisible();
  await page.goto('/app/mensajes');
  await page.getByRole('button', { name: 'Simular mensaje', exact: true }).click();
  await page.getByLabel('Nombre del paciente').fill('Daniel Demo');
  await page.getByLabel('Teléfono', { exact: true }).fill('+51 999 456 789');
  await page.getByLabel('Mensaje recibido').fill('Quiero una cita de control.');
  await page.getByRole('button', { name: 'Simular mensaje recibido' }).click();
  await expect(page.locator('.conversation-header').getByText('Daniel Demo')).toBeVisible();
  await page.getByLabel('Respuesta al paciente').fill('Te ayudamos a reservar.');
  await page.getByRole('button', { name: 'Enviar respuesta' }).click();
  await expect(
    page.locator('.conversation-thread').getByText('Te ayudamos a reservar.'),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/mensajes-desktop.png', fullPage: true });
  await page.goto('/app/citas');
  await page.getByRole('button', { name: 'Vista calendario' }).click();
  await expect(page.locator('.calendar-view')).toBeVisible();
  await page.goto('/app/reportes');
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  expect((await download).suggestedFilename()).toMatch(/praxia-citas/);
  await page.goto('/app/configuracion');
  await page.getByLabel('Dirección').fill('Av. Prueba 123, Lima');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Configuración guardada')).toBeVisible();
});
test('móvil: navegación, tablas y chat sin desbordamiento', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tu salud, nuestra prioridad.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/landing-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Abrir chat de WhatsApp' }).click();
  await page.getByRole('button', { name: 'Agendar una cita', exact: true }).click();
  await expect(page.getByPlaceholder('Escribe tu nombre completo...')).toBeEnabled();
  await page.screenshot({ path: 'test-results/chat-mobile.png' });
  await page.getByRole('button', { name: 'Cerrar chat', exact: true }).click();
  await login(page);
  await expect(page.getByRole('link', { name: 'Total de leads' })).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  await page.getByRole('link', { name: 'Leads / Pacientes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Leads / Pacientes' })).toBeVisible();
  await expect(page.locator('.data-table tbody tr')).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/leads-mobile.png', fullPage: true });
});
