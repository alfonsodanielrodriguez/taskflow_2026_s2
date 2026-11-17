import http from 'k6/http';
import { check, fail } from 'k6';

const base = __ENV.BASE_URL || 'http://127.0.0.1:3000';
export const options = {
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || '30s',
  thresholds: { 'http_req_duration{endpoint:tasks}': ['p(95)<500'], 'http_req_failed{endpoint:tasks}': ['rate<0.01'], checks: ['rate==1'] },
};
export function setup() {
  const login = http.post(`${base}/api/auth/login`, JSON.stringify({ email: 'performance@test.com', password: 'Password1' }), { headers: { 'Content-Type': 'application/json' } });
  if (login.status !== 200 || !login.json('token')) fail(`Login failed: ${login.status}`);
  const projects = http.get(`${base}/api/projects`, { headers: { Authorization: `Bearer ${login.json('token')}` } });
  if (projects.status !== 200 || !projects.json()[0]?.id) fail(`Project lookup failed: ${projects.status}`);
  return { token: login.json('token'), projectId: projects.json()[0].id };
}
export default function (data) {
  const response = http.get(`${base}/api/projects/${data.projectId}/tasks?limit=20&offset=0`, { headers: { Authorization: `Bearer ${data.token}` }, tags: { endpoint: 'tasks' } });
  check(response, { 'listado responde 200': (r) => r.status === 200, 'contiene items': (r) => Array.isArray(r.json('items')) });
}
