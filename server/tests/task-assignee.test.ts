import request from 'supertest';
import { app, auth, createProject, createTask, registerUser } from './helpers';

describe('Validación de asignados', () => {
  it('valida membresía tanto al crear como al editar y permite desasignar', async () => {
    const owner = await registerUser('assignee-owner@test.com');
    const outsider = await registerUser('assignee-outsider@test.com');
    const project = await createProject(owner.token, 'Proyecto de asignados');
    const task = await createTask(owner.token, project.id, {
      title: 'Tarea asignada', assigneeId: owner.id,
    });
    expect(task.assigneeId).toBe(owner.id);

    for (const assigneeId of ['invalid', outsider.id]) {
      const created = await request(app).post(`/api/projects/${project.id}/tasks`)
        .set(auth(owner.token)).send({ title: 'Asignado inválido', assigneeId });
      const updated = await request(app).patch(`/api/tasks/${task.id}`)
        .set(auth(owner.token)).send({ assigneeId });
      expect(created.status).toBe(400);
    expect(created.body.error).toEqual(expect.objectContaining({ code: 'VALIDATION_ERROR', message: expect.any(String), details: expect.any(Array) }));
    expect(created.body.error.message.length).toBeGreaterThan(0);
      expect(updated.status).toBe(400);
    expect(updated.body.error).toEqual(expect.objectContaining({ code: 'VALIDATION_ERROR', message: expect.any(String), details: expect.any(Array) }));
    expect(updated.body.error.message.length).toBeGreaterThan(0);
    }

    const unchanged = await request(app).patch(`/api/tasks/${task.id}`)
      .set(auth(owner.token)).send({ title: 'Título actualizado' });
    expect(unchanged.body.assigneeId).toBe(owner.id);

    const cleared = await request(app).patch(`/api/tasks/${task.id}`)
      .set(auth(owner.token)).send({ assigneeId: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.assigneeId).toBeNull();

    const reassigned = await request(app).patch(`/api/tasks/${task.id}`)
      .set(auth(owner.token)).send({ assigneeId: owner.id });
    expect(reassigned.status).toBe(200);
    expect(reassigned.body.assigneeId).toBe(owner.id);
  });
});
