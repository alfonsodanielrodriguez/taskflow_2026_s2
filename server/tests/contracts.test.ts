import { MatchersV3, PactV3, Verifier } from '@pact-foundation/pact';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { Server } from 'http';
import { app } from './helpers';
import { db } from '../src/lib/db';

const { eachLike, like, regex } = MatchersV3;
const CONTRACT_DIR = path.resolve(__dirname, '../pacts');
const LOGIN_STATE = 'Ana existe con la contraseña de prueba';
const COMMENTS_STATE = 'Ana es miembro de la tarea task-1, que tiene un comentario';
const CONTRACT_TOKEN = jwt.sign({ userId: 1, email: 'ana@test.com' }, 'test-secret', {
  noTimestamp: true,
});

async function resetProviderState(): Promise<void> {
  await db.taskTag.deleteMany();
  await db.tag.deleteMany();
  await db.comment.deleteMany();
  await db.taskHistory.deleteMany();
  await db.task.deleteMany();
  await db.projectMember.deleteMany();
  await db.project.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.user.deleteMany();
}

async function createAna(): Promise<void> {
  await db.user.create({
    data: {
      id: 1,
      email: 'ana@test.com',
      name: 'Ana Pereira',
      passwordHash: await bcrypt.hash('Password1', 10),
    },
  });
}

async function createCommentsState(): Promise<void> {
  await resetProviderState();
  await createAna();

  await db.project.create({
    data: {
      id: 1,
      name: 'Proyecto de contrato',
      ownerId: 1,
    },
  });
  await db.projectMember.create({
    data: { id: 1, projectId: 1, userId: 1, role: 'OWNER' },
  });
  await db.task.create({
    data: { id: 1, projectId: 1, title: 'Tarea de contrato' },
  });
  await db.comment.create({
    data: {
      id: 1,
      taskId: 1,
      authorId: 1,
      body: 'Comentario de verificación',
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
    },
  });
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

describe('Contratos de API con Pact', () => {
  it('define y verifica el contrato de login', async () => {
    const pact = new PactV3({
      consumer: 'TaskFlowWeb',
      provider: 'TaskFlowAPI',
      dir: CONTRACT_DIR,
    });

    await pact
      .addInteraction({
        states: [{ description: LOGIN_STATE }],
        uponReceiving: 'un login válido de Ana',
        withRequest: {
          method: 'POST',
          path: '/api/auth/login',
          headers: { 'Content-Type': 'application/json' },
          body: { email: 'ana@test.com', password: 'Password1' },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': regex(/^application\/json.*$/, 'application/json; charset=utf-8'),
          },
          body: {
            token: regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, 'a.b.c'),
            user: {
              id: like('user-1'),
              email: 'ana@test.com',
              name: like('Ana Pereira'),
              createdAt: regex(
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
                '2026-01-02T03:04:05.000Z',
              ),
            },
          },
        },
      })
      .executeTest(async (mockServer) => {
        const response = await fetch(`${mockServer.url}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'ana@test.com', password: 'Password1' }),
        });
        const body: unknown = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual(
          expect.objectContaining({
            token: expect.any(String),
            user: expect.objectContaining({
              id: 'user-1',
              email: 'ana@test.com',
              name: expect.any(String),
              createdAt: expect.any(String),
            }),
          }),
        );
      });
  });

  it('define y verifica el contrato para listar comentarios', async () => {
    const pact = new PactV3({
      consumer: 'TaskFlowWeb',
      provider: 'TaskFlowAPI',
      dir: CONTRACT_DIR,
    });

    await pact
      .addInteraction({
        states: [{ description: COMMENTS_STATE }],
        uponReceiving: 'la lista de comentarios de task-1',
        withRequest: {
          method: 'GET',
          path: '/api/tasks/task-1/comments',
          headers: { Authorization: `Bearer ${CONTRACT_TOKEN}` },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': regex(/^application\/json.*$/, 'application/json; charset=utf-8'),
          },
          body: eachLike(
            {
              id: like('comment-1'),
              taskId: 'task-1',
              body: like('Comentario de verificación'),
              createdAt: regex(
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
                '2026-01-02T03:04:05.000Z',
              ),
            },
            1,
          ),
        },
      })
      .executeTest(async (mockServer) => {
        const response = await fetch(`${mockServer.url}/api/tasks/task-1/comments`, {
          headers: { Authorization: `Bearer ${CONTRACT_TOKEN}` },
        });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual([
          expect.objectContaining({
            id: 'comment-1',
            taskId: 'task-1',
            body: expect.any(String),
            createdAt: expect.any(String),
          }),
        ]);
      });
  });

  it('verifica TaskFlowAPI contra los contratos del consumidor', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
      await closeServer(server);
      throw new Error('No se pudo obtener el puerto del servidor de pruebas');
    }

    try {
      await new Verifier({
        provider: 'TaskFlowAPI',
        providerBaseUrl: `http://127.0.0.1:${address.port}`,
        pactUrls: [path.join(CONTRACT_DIR, 'TaskFlowWeb-TaskFlowAPI.json')],
        stateHandlers: {
          [LOGIN_STATE]: {
            setup: async () => {
              await resetProviderState();
              await createAna();
            },
            teardown: resetProviderState,
          },
          [COMMENTS_STATE]: {
            setup: createCommentsState,
            teardown: resetProviderState,
          },
        },
      }).verifyProvider();
    } finally {
      await closeServer(server);
    }
  });
});
