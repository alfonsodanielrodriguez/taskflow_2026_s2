import request from 'supertest';
import { app } from './helpers';

describe('Auth', () => {
  it('registra un usuario nuevo', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'ana@test.com', password: 'Password1' });

    expect(res.status).toBe(201);
  });

  it('inicia sesión con credenciales válidas', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@test.com', password: 'Password1' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Password1' });

    expect(res.status).toBe(200);
  });

  it('rechaza el login con contraseña incorrecta', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'wrong@test.com', password: 'Password1' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'Otracosa9' });

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual(expect.objectContaining({ code: 'UNAUTHORIZED', message: expect.any(String), details: expect.any(Array) }));
    expect(res.body.error.message.length).toBeGreaterThan(0);
  });

  it('reinicia el contador de intentos fallidos después de un login exitoso', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'counter-reset@test.com', password: 'Password1' });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'counter-reset@test.com', password: 'Wrongpass1' })
        .expect(401)
      .expect(res => {
        expect(res.body.error).toEqual(expect.objectContaining({ code: 'UNAUTHORIZED', message: expect.any(String), details: expect.any(Array) }));
        expect(res.body.error.message.length).toBeGreaterThan(0);
      });
    }

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'counter-reset@test.com', password: 'Password1' })
      .expect(200);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'counter-reset@test.com', password: 'Wrongpass1' })
        .expect(401)
      .expect(res => {
        expect(res.body.error).toEqual(expect.objectContaining({ code: 'UNAUTHORIZED', message: expect.any(String), details: expect.any(Array) }));
        expect(res.body.error.message.length).toBeGreaterThan(0);
      });
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'counter-reset@test.com', password: 'Password1' });

    expect(res.status).toBe(200);
  });
});
