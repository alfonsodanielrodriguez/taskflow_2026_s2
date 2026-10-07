import request from 'supertest';
import { app, auth, registerUser } from './helpers';

describe('Proyectos', () => {
  it('crea un proyecto', async () => {
    const { token } = await registerUser('proj1@test.com');

    const res = await request(app)
      .post('/api/projects')
      .set(auth(token))
      .send({ name: 'Mi Proyecto', description: 'Descripción' });

    expect(res.status).toBe(201);
  });

  it('rechaza crear un proyecto duplicado para el mismo usuario', async () => {
    const { token } = await registerUser('proj-duplicate@test.com');
    await request(app)
      .post('/api/projects')
      .set(auth(token))
      .send({ name: 'Proyecto duplicado' });

    const res = await request(app)
      .post('/api/projects')
      .set(auth(token))
      .send({ name: 'Proyecto duplicado' });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('You already have a project with that name');
  });

  it('lista los proyectos del usuario', async () => {
    const { token } = await registerUser('proj2@test.com');
    await request(app).post('/api/projects').set(auth(token)).send({ name: 'Proyecto A' });
    await request(app).post('/api/projects').set(auth(token)).send({ name: 'Proyecto B' });

    const res = await request(app).get('/api/projects').set(auth(token));

    expect(res.body).toHaveLength(2);
  });

  it('rechaza crear un proyecto sin autenticación', async () => {
    const res = await request(app).post('/api/projects').send({ name: 'Sin token' });

    expect(res.status).toBe(401);
  });
});
