// API reproductions retained separately from the UI acceptance suite.
// page.request uses the traced browser context; no UI coverage is claimed here.
import { test, expect } from './fixtures/task';

test('US-02 c5 API: successful login resets failed attempts', async ({ page, scenario }) => {
  const credentials = { email: scenario.user.email, password: 'Password1' };
  const fail = async () => {
    const response = await page.request.post('/api/auth/login', { data: { ...credentials, password: 'Wrongpass1' } });
    expect(response.status()).toBe(401);
    expect((await response.json()).error.code).toBe('UNAUTHORIZED');
  };
  for (let n = 0; n < 3; n++) await fail();
  expect((await page.request.post('/api/auth/login', { data: credentials })).status()).toBe(200);
  for (let n = 0; n < 3; n++) await fail();
  const response = await page.request.post('/api/auth/login', { data: credentials });
  expect(response.status()).toBe(200);
});

test('US-13 c1 API: an outsider cannot delete a task', async ({ page, scenario }) => {
  const registration = await page.request.post('/api/auth/register', { data: { email: `delete-outsider-${scenario.taskId}@test.com`, password: 'Password1' } });
  expect(registration.status()).toBe(201);
  const outsider = await registration.json();
  const response = await page.request.delete(`/api/tasks/${scenario.taskId}`, { headers: { Authorization: `Bearer ${outsider.token}` } });
  expect(response.status()).toBe(403);
  expect((await response.json()).error.code).toBe('FORBIDDEN');
  const detail = await page.request.get(`/api/tasks/${scenario.taskId}`, { headers: { Authorization: `Bearer ${scenario.token}` } });
  expect(detail.status()).toBe(200);
});
