import { test, expect } from './fixtures/task';

test('US-12 feliz: edita los campos permitidos', async ({ task }) => {
  await task.field('title-input').fill('Título actualizado');
  await task.field('description-input').fill('Detalle nuevo');
  await task.field('priority-select').selectOption('HIGH');
  await task.save();
  await task.reload();
  await expect(task.field('title-input')).toHaveValue('Título actualizado');
  await expect(task.field('description-input')).toHaveValue('Detalle nuevo');
  await expect(task.field('priority-select')).toHaveValue('HIGH');
});
test('US-12 error: rechaza título menor al mínimo', async ({ task, page }) => {
  await task.field('title-input').fill('ab');
  await task.save();
  await expect(page.getByRole('alert')).toBeVisible();
  await task.reload();
  await expect(task.field('title-input')).toHaveValue('Tarea para pruebas');
});
test('US-12 borde: editar título conserva los otros campos', async ({ task }) => {
  await task.field('title-input').fill('Solo cambia el título');
  await task.save();
  await task.reload();
  await expect(task.field('title-input')).toHaveValue('Solo cambia el título');
  await expect(task.field('description-input')).toHaveValue('');
  await expect(task.field('priority-select')).toHaveValue('MEDIUM');
});
test('US-14 feliz: asigna a un miembro sin cambiar estado', async ({ task, scenario }) => {
  await task.field('assignee-select').selectOption(scenario.memberId);
  await task.save();
  await task.reload();
  await expect(task.field('assignee-select')).toHaveValue(scenario.memberId);
  await expect(task.field('current-status')).toHaveText('TODO');
});
test('US-14 error: el selector excluye usuarios externos', async ({ task, scenario, page }) => {
  const response = await scenario.api.post('/api/auth/register', { data: { email: `outsider-${scenario.taskId}@test.com`, password: 'Password1' } });
  expect(response.status()).toBe(201);
  const outsider = await response.json();
  await expect(task.field('assignee-select').locator(`option[value="${outsider.user.id}"]`)).toHaveCount(0);
  await expect(page.getByTestId('task-assignee-select').locator(`option[value="${scenario.memberId}"]`)).toHaveCount(1);
});
test('US-14 borde: permite desasignar', async ({ task, scenario }) => {
  await task.field('assignee-select').selectOption(scenario.memberId);
  await task.save();
  await task.field('assignee-select').selectOption('');
  await task.save();
  await task.reload();
  await expect(task.field('assignee-select')).toHaveValue('');
});
test('US-15 feliz: agrega una etiqueta normalizada', async ({ task, page }) => {
  await task.addTag('  backend  ');
  await expect(page.getByTestId('tag-chip-name')).toHaveText('backend');
});
test('US-15 error: rechaza etiqueta vacía', async ({ task, page }) => {
  await task.addTag('   ');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('tag-chip')).toHaveCount(0);
});
test('US-15 borde: repetir etiqueta ignorando mayúsculas no crea duplicado', async ({ task, page }) => {
  await task.addTag('Bug');
  await task.addTag('bug');
  await expect(page.getByTestId('tag-chip')).toHaveCount(1);
  await expect(page.getByTestId('tag-chip-name')).toHaveText('bug');
});
test('US-16 feliz: guarda el día calendario sin hora', async ({ task }) => {
  await task.field('duedate-input').fill('2026-09-15');
  await task.save();
  await task.reload();
  await expect(task.field('duedate-value')).toHaveText('2026-09-15');
});
test('US-16 error: el control de fecha impide texto inválido', async ({ task }) => {
  // Native date inputs reject non-ISO text before any HTTP request.
  await task.field('duedate-input').focus();
  await task.field('duedate-input').pressSequentially('fecha-invalida');
  await expect(task.field('duedate-input')).toHaveValue('');
  await expect(task.field('duedate-value')).toHaveText('—');
});
test('US-16 borde: acepta fechas pasadas', async ({ task }) => {
  await task.field('duedate-input').fill('2000-01-01');
  await task.save();
  await task.reload();
  await expect(task.field('duedate-value')).toHaveText('2000-01-01');
});
test('US-16 borde: permite quitar la fecha', async ({ task }) => {
  await task.field('duedate-input').fill('2026-09-15');
  await task.save();
  await task.field('duedate-input').fill('');
  await task.save();
  await task.reload();
  await expect(task.field('duedate-value')).toHaveText('—');
});
