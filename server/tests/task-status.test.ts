import request from 'supertest';
import { app, auth, createProject, createTask, registerUser } from './helpers';

describe('Autorización de cambios de estado', () => {
  it('conserva permisos, transiciones e historial al simplificar el flujo', async () => {
    const owner = await registerUser('status-owner@test.com');
    const member = await registerUser('status-member@test.com');
    const project = await createProject(owner.token, 'Proyecto de estados');
    await request(app).post(`/api/projects/${project.id}/members`)
      .set(auth(owner.token)).send({ email: 'status-member@test.com' }).expect(201);
    const task = await createTask(owner.token, project.id, { title: 'Tarea de estados' });

    await request(app).patch(`/api/tasks/${task.id}`).set(auth(member.token))
      .send({ status: 'IN_PROGRESS' }).expect(403);
    await request(app).patch(`/api/tasks/${task.id}`).set(auth(owner.token))
      .send({ status: 'IN_PROGRESS' }).expect(200);

    // Repetir el estado actual no exige privilegios ni agrega historial.
    await request(app).patch(`/api/tasks/${task.id}`).set(auth(member.token))
      .send({ status: 'IN_PROGRESS' }).expect(200);
    await request(app).patch(`/api/tasks/${task.id}`).set(auth(owner.token))
      .send({ assigneeId: member.id }).expect(200);
    await request(app).patch(`/api/tasks/${task.id}`).set(auth(member.token))
      .send({ status: 'DONE' }).expect(200);
    await request(app).patch(`/api/tasks/${task.id}`).set(auth(owner.token))
      .send({ status: 'TODO' }).expect(422);

    const history = await request(app).get(`/api/tasks/${task.id}/history`)
      .set(auth(owner.token)).expect(200);
    expect(history.body.map((entry: { toStatus: string }) => entry.toStatus))
      .toEqual(['TODO', 'IN_PROGRESS', 'DONE']);
  });
});
