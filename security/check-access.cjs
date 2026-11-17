// Ejecutar solo contra una instancia local con datos descartables.
const base = process.env.API_BASE_URL || 'http://127.0.0.1:3000/api';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/api$/.test(base)) throw new Error('Solo se permite una API local');
async function request(path, options = {}) {
  const response = await fetch(base + path, { ...options, headers: { 'content-type': 'application/json', ...options.headers } });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}
async function run() {
  const suffix = Date.now();
  const register = (name) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email: `${name}-${suffix}@test.com`, password: 'Password1' }) });
  const owner = await register('owner');
  const outsider = await register('outsider');
  if (!owner.body?.token || !outsider.body?.token) throw new Error('No se pudieron crear usuarios de prueba');
  const auth = (token) => ({ Authorization: `Bearer ${token}` });
  const project = await request('/projects', { method: 'POST', headers: auth(owner.body.token), body: JSON.stringify({ name: `Proyecto ${suffix}` }) });
  const task = await request(`/projects/${project.body.id}/tasks`, { method: 'POST', headers: auth(owner.body.token), body: JSON.stringify({ title: 'Tarea de seguridad' }) });
  if (!task.body?.id) throw new Error('No se pudo crear la tarea de prueba');
  const deleted = await request(`/tasks/${task.body.id}`, { method: 'DELETE', headers: auth(outsider.body.token) });
  const after = await request(`/tasks/${task.body.id}`, { headers: auth(owner.body.token) });
  const reset = await request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: `owner-${suffix}@test.com` }) });
  const changed = await request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: reset.body?.token, newPassword: 'NewPassword1' }) });
  const login = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: `owner-${suffix}@test.com`, password: 'NewPassword1' }) });
  console.log(JSON.stringify({ deleteByNonMember: { expected: 403, actual: deleted.status, ownerReadAfter: after.status }, passwordReset: { status: reset.status, tokenReturnedInResponse: typeof reset.body?.token === 'string', resetStatus: changed.status, loginWithNewPassword: login.status } }, null, 2));
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
