import { expect, test, APIRequestContext } from '@playwright/test';

type Setup = { api: APIRequestContext; token: string; projectId: string; taskId: string; memberId: string };

let sequence = 0;

async function setup(api: APIRequestContext): Promise<Setup> {
  const suffix = `${Date.now()}-${++sequence}`;
  const owner = await api.post('/api/auth/register', {
    data: { email: `owner-${suffix}@test.com`, password: 'Password1' },
  });
  const ownerBody = await owner.json();
  const token = ownerBody.token as string;
  const auth = { Authorization: `Bearer ${token}` };
  const project = await api.post('/api/projects', { headers: auth, data: { name: `Proyecto ${suffix}` } });
  const projectBody = await project.json();
  const member = await api.post('/api/auth/register', {
    data: { email: `member-${suffix}@test.com`, password: 'Password1' },
  });
  const memberBody = await member.json();
  await api.post(`/api/projects/${projectBody.id}/members`, {
    headers: auth,
    data: { email: `member-${suffix}@test.com` },
  });
  const task = await api.post(`/api/projects/${projectBody.id}/tasks`, {
    headers: auth,
    data: { title: 'Tarea para pruebas', priority: 'MEDIUM' },
  });
  const taskBody = await task.json();
  return { api, token, projectId: projectBody.id, taskId: taskBody.id, memberId: memberBody.user.id };
}

async function authenticated(api: APIRequestContext, token: string, path: string, data: unknown) {
  return api.patch(`/api${path}`,  { headers: { Authorization: `Bearer ${token}` }, data });
}

test('US-12 feliz: edita los campos permitidos', async ({ request }) => {
  const s = await setup(request);
  const response = await authenticated(request, s.token, `/tasks/${s.taskId}`, {
    title: 'Título actualizado', description: 'Detalle nuevo', priority: 'HIGH',
  });
  const body = await response.json();
  expect(response.status()).toBe(200);
  expect(body).toMatchObject({ title: 'Título actualizado', description: 'Detalle nuevo', priority: 'HIGH' });
});

test('US-12 error: rechaza título menor al mínimo', async ({ request }) => {
  const s = await setup(request);
  const response = await authenticated(request, s.token, `/tasks/${s.taskId}`, { title: 'ab' });
  const body = await response.json();
  expect(response.status()).toBe(400);
  expect(body.error.code).toBe('VALIDATION_ERROR');
});

test('US-12 borde: los campos omitidos conservan sus valores', async ({ request }) => {
  const s = await setup(request);
  const beforeResponse = await request.get(`/api/tasks/${s.taskId}`, { headers: { Authorization: `Bearer ${s.token}` } });
  const before = await beforeResponse.json();
  const response = await authenticated(request, s.token, `/tasks/${s.taskId}`, { title: 'Solo cambia el título' });
  const body = await response.json();
  expect(response.status()).toBe(200);
  expect(body).toMatchObject({ title: 'Solo cambia el título', description: before.description, priority: before.priority });
});

test('US-14 feliz: asigna la tarea a un miembro del proyecto sin cambiar su estado', async ({ request }) => {
  const s = await setup(request);
  const response = await authenticated(request, s.token, `/tasks/${s.taskId}`, { assigneeId: s.memberId });
  const body = await response.json();
  expect(response.status()).toBe(200);
  expect(body.assigneeId).toBe(s.memberId);
  expect(body.status).toBe('TODO');
});

test('US-14 error: rechaza un asignado que no pertenece al proyecto', async ({ request }) => {
  const s = await setup(request);
  const outsider = await request.post('/api/auth/register', {
    data: { email: `outsider-${Date.now()}@test.com`, password: 'Password1' },
  });
  const outsiderBody = await outsider.json();
  const response = await authenticated(request, s.token, `/tasks/${s.taskId}`, { assigneeId: outsiderBody.user.id });
  const body = await response.json();
  expect(response.status()).toBe(400);
  expect(body.error.code).toBe('VALIDATION_ERROR');
});

test('US-14 borde: permite desasignar con null', async ({ request }) => {
  const s = await setup(request);
  await authenticated(request, s.token, `/tasks/${s.taskId}`, { assigneeId: s.memberId });
  const response = await authenticated(request, s.token, `/tasks/${s.taskId}`, { assigneeId: null });
  const body = await response.json();
  expect(response.status()).toBe(200);
  expect(body.assigneeId).toBeNull();
});

test('US-15 feliz: agrega y devuelve una etiqueta normalizada', async ({ request }) => {
  const s = await setup(request);
  const response = await request.post(`/api/tasks/${s.taskId}/tags`, {
    headers: { Authorization: `Bearer ${s.token}` }, data: { name: '  backend  ' },
  });
  const body = await response.json();
  expect(response.status()).toBe(201);
  expect(body.name).toBe('backend');
});

test('US-15 error: rechaza una etiqueta vacía', async ({ request }) => {
  const s = await setup(request);
  const response = await request.post(`/api/tasks/${s.taskId}/tags`, {
    headers: { Authorization: `Bearer ${s.token}` }, data: { name: '   ' },
  });
  const body = await response.json();
  expect(response.status()).toBe(400);
  expect(body.error.code).toBe('VALIDATION_ERROR');
});

test('US-15 borde: repetir etiqueta ignorando mayúsculas no crea duplicado', async ({ request }) => {
  const s = await setup(request);
  const headers = { Authorization: `Bearer ${s.token}` };
  const first = await request.post(`/api/tasks/${s.taskId}/tags`, { headers, data: { name: 'Bug' } });
  await first.json();
  const response = await request.post(`/api/tasks/${s.taskId}/tags`, { headers, data: { name: 'bug' } });
  const body = await response.json();
  const detailResponse = await request.get(`/api/tasks/${s.taskId}`, { headers });
  const detail = await detailResponse.json();
  expect(response.status()).toBe(200);
  expect(detail.tags).toHaveLength(1);
  expect(body.name).toBe('bug');
});

test('US-16 feliz: guarda la fecha como día calendario sin hora', async ({ request }) => {
  const s = await setup(request);
  const response = await authenticated(request, s.token, `/tasks/${s.taskId}`, { dueDate: '2026-09-15' });
  const body = await response.json();
  expect(response.status()).toBe(200);
  expect(body.dueDate).toBe('2026-09-15');
});

test('US-16 error: rechaza una fecha con formato inválido', async ({ request }) => {
  const s = await setup(request);
  const response = await authenticated(request, s.token, `/tasks/${s.taskId}`, { dueDate: '15/09/2026' });
  const body = await response.json();
  expect(response.status()).toBe(400);
  expect(body.error.code).toBe('VALIDATION_ERROR');
});

test('US-16 borde: acepta fechas pasadas', async ({ request }) => {
  const s = await setup(request);
  const pastResponse = await authenticated(request, s.token, `/tasks/${s.taskId}`, { dueDate: '2000-01-01' });
  const past = await pastResponse.json();
  expect(pastResponse.status()).toBe(200);
  expect(past.dueDate).toBe('2000-01-01');
});

test('US-16 borde: permite quitar la fecha enviando null', async ({ request }) => {
  const s = await setup(request);
  const initial = await authenticated(request, s.token, `/tasks/${s.taskId}`, { dueDate: '2026-09-15' });
  await initial.json();
  const clearResponse = await authenticated(request, s.token, `/tasks/${s.taskId}`, { dueDate: null });
  const cleared = await clearResponse.json();
  expect(clearResponse.status()).toBe(200);
  expect(cleared.dueDate).toBeNull();
});
