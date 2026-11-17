import { test as base, expect, APIRequestContext } from '@playwright/test';
import { TaskDetail } from '../../../e2e/src/components/task-detail';
type Setup = { api: APIRequestContext; token: string; projectId: string; taskId: string; memberId: string; user: { id: string; email: string } };
let sequence = 0;
export async function setup(api: APIRequestContext): Promise<Setup> {
  const suffix = `${Date.now()}-${++sequence}`;
  const owner = await api.post('/api/auth/register', {
    data: { email: `owner-${suffix}@test.com`, password: 'Password1' },
  });
  expect(owner.status()).toBe(201);
  const ownerBody = await owner.json();
  const token = ownerBody.token as string;
  const auth = { Authorization: `Bearer ${token}` };
  const project = await api.post('/api/projects', { headers: auth, data: { name: `Proyecto ${suffix}` } });
  expect(project.status()).toBe(201);
  const projectBody = await project.json();
  const member = await api.post('/api/auth/register', {
    data: { email: `member-${suffix}@test.com`, password: 'Password1' },
  });
  expect(member.status()).toBe(201);
  const memberBody = await member.json();
  await api.post(`/api/projects/${projectBody.id}/members`, {
    headers: auth,
    data: { email: `member-${suffix}@test.com` },
  });
  // The client discovers members from assigned tasks; seed a separate task so
  // the assignee selector contains the member without forging browser storage.
  const reference = await api.post(`/api/projects/${projectBody.id}/tasks`, {
    headers: auth, data: { title: 'Referencia de miembro', assigneeId: memberBody.user.id },
  });
  expect(reference.status()).toBe(201);
  const task = await api.post(`/api/projects/${projectBody.id}/tasks`, {
    headers: auth,
    data: { title: 'Tarea para pruebas', priority: 'MEDIUM' },
  });
  expect(task.status()).toBe(201);
  const taskBody = await task.json();
  return { api, token, projectId: projectBody.id, taskId: taskBody.id, memberId: memberBody.user.id, user: ownerBody.user };
}

export async function authenticated(api: APIRequestContext, token: string, path: string, data: unknown) {
  return api.patch(`/api${path}`,  { headers: { Authorization: `Bearer ${token}` }, data });
}

export const test = base.extend<{ scenario: Setup; task: TaskDetail }>({
  scenario: async ({ request }, use) => {
    const scenario = await setup(request);
    try { await use(scenario); }
    finally {
      await request.delete(`/api/projects/${scenario.projectId}`, { headers: { Authorization: `Bearer ${scenario.token}` } });
    }
  },
  task: async ({ page, scenario }, use) => {
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('taskflow_token', token);
      localStorage.setItem('taskflow_user', JSON.stringify(user));
    }, { token: scenario.token, user: scenario.user });
    await page.goto(`/projects/${scenario.projectId}/tasks/${scenario.taskId}`);
    await expect(page.getByTestId('task-detail-page')).toBeVisible();
    await use(new TaskDetail(page));
  },
});
export { expect };
