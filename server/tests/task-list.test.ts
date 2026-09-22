import request from 'supertest';
import { db } from '../src/lib/db';
import { app, auth, createProject, createTask, registerUser } from './helpers';

describe('Listado de tareas', () => {
  it('incluye asignados y conteos sin consultas individuales por tarea', async () => {
    const owner = await registerUser('list-owner@test.com');
    const project = await createProject(owner.token, 'Proyecto de listado');
    const assigned = await createTask(owner.token, project.id, {
      title: 'Tarea con asignado', assigneeId: owner.id,
    });
    const unassigned = await createTask(owner.token, project.id, { title: 'Tarea sin asignado' });
    for (const body of ['Primero', 'Segundo']) {
      await request(app).post(`/api/tasks/${assigned.id}/comments`)
        .set(auth(owner.token)).send({ body }).expect(201);
    }

    const individualUserLookup = jest.spyOn(db.user, 'findUnique');
    const individualCommentCount = jest.spyOn(db.comment, 'count');
    try {
      for (const query of ['', '?search=Tarea']) {
        const res = await request(app).get(`/api/projects/${project.id}/tasks${query}`)
          .set(auth(owner.token)).expect(200);
        expect(res.body.items).toEqual([
          expect.objectContaining({
            id: assigned.id,
            assignee: { id: owner.id, email: 'list-owner@test.com' },
            commentCount: 2,
          }),
          expect.objectContaining({ id: unassigned.id, assignee: null, commentCount: 0 }),
        ]);
      }
      expect(individualUserLookup).not.toHaveBeenCalled();
      expect(individualCommentCount).not.toHaveBeenCalled();
    } finally {
      individualUserLookup.mockRestore();
      individualCommentCount.mockRestore();
    }

    const emptyProject = await createProject(owner.token, 'Proyecto vacío');
    const empty = await request(app).get(`/api/projects/${emptyProject.id}/tasks`)
      .set(auth(owner.token)).expect(200);
    expect(empty.body.items).toEqual([]);
    expect(empty.body.total).toBe(0);
  });
});
