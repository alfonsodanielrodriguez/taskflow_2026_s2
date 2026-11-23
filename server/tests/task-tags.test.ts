import request from 'supertest';
import { app, auth, createProject, createTask, registerUser } from './helpers';
import { db } from '../src/lib/db';

async function scenario(email: string) {
  const owner = await registerUser(email);
  const project = await createProject(owner.token, 'Etiquetas');
  const task = await createTask(owner.token, project.id, { title: 'Tarea con etiquetas' });
  const add = (name: string) => request(app).post(`/api/tasks/${task.id}/tags`)
    .set(auth(owner.token)).send({ name });
  return { owner, task, add };
}

describe('US-15: etiquetas normalizadas e idempotentes', () => {
  it('normaliza espacios y mayusculas y devuelve 200 al repetir sin duplicar', async () => {
    const { owner, task, add } = await scenario('tag-normalized@test.com');
    const first = await add('  Bug  ').expect(201);
    expect(first.body.name).toBe('bug');
    const repeated = await add('BUG').expect(200);
    expect(repeated.body).toEqual(first.body);
    const detail = await request(app).get(`/api/tasks/${task.id}`).set(auth(owner.token)).expect(200);
    expect(detail.body.tags).toEqual([first.body]);
  });
  it('permite repetir al alcanzar diez etiquetas pero rechaza una nueva', async () => {
    const { add } = await scenario('tag-limit@test.com');
    for (let i = 0; i < 10; i++) await add(`tag-${i}`).expect(201);
    await add('TAG-0').expect(200);
    const response = await add('otra').expect(400);
    expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR', message: expect.stringContaining('10') });
  });
  it('reconoce una etiqueta previa con mayusculas sin crear otro enlace', async () => {
    const { owner, task, add } = await scenario('tag-legacy@test.com');
    const taskId = Number(task.id.split('-')[1]);
    await db.taskTag.create({ data: { task: { connect: { id: taskId } }, tag: { create: { name: 'Legacy' } } } });
    await add('legacy').expect(200);
    const detail = await request(app).get(`/api/tasks/${task.id}`).set(auth(owner.token)).expect(200);
    expect(detail.body.tags).toHaveLength(1);
    expect(detail.body.tags[0].name).toBe('legacy');
  });
});
