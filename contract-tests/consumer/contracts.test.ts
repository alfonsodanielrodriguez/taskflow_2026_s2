import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { MatchersV3, PactV3 } from '@pact-foundation/pact';
import { api, setToken } from '../../client/src/lib/api';

const { eachLike, like, regex } = MatchersV3;
const CONTRACT_DIR = 'contract-tests/pacts';
const PACT_OPTIONS = {
  consumer: 'TaskFlowWeb',
  provider: 'TaskFlowAPI',
  dir: CONTRACT_DIR,
};
const JWT_HEADER = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
const JWT_PAYLOAD = Buffer.from(JSON.stringify({ userId: 1, email: 'ana@test.com' })).toString(
  'base64url',
);
const TOKEN_BODY = `${JWT_HEADER}.${JWT_PAYLOAD}`;
const CONTRACT_TOKEN = `${TOKEN_BODY}.${createHmac('sha256', 'test-secret')
  .update(TOKEN_BODY)
  .digest('base64url')}`;

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  };
}

async function withMockServerFetch<T>(
  mockServerUrl: string,
  run: () => Promise<T>,
): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init) =>
    originalFetch(new URL(String(input), mockServerUrl), init);

  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function setBrowserStorage(): void {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
}

async function verifyLoginConsumerContract(): Promise<void> {
  const pact = new PactV3(PACT_OPTIONS);
  await pact
    .addInteraction({
      states: [{ description: 'Ana existe con la contraseña de prueba' }],
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
      setBrowserStorage();
      setToken('');
      const response = await withMockServerFetch(mockServer.url, () =>
        api<LoginResponse>('/auth/login', {
          method: 'POST',
          body: { email: 'ana@test.com', password: 'Password1' },
        }),
      );

      assert.equal(typeof response.token, 'string');
      assert.equal(response.user.id, 'user-1');
      assert.equal(response.user.email, 'ana@test.com');
      assert.equal(typeof response.user.createdAt, 'string');
    });
}

async function verifyCommentsConsumerContract(): Promise<void> {
  const pact = new PactV3(PACT_OPTIONS);
  await pact
    .addInteraction({
      states: [{ description: 'Ana es miembro de la tarea task-1, que tiene un comentario' }],
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
      setBrowserStorage();
      setToken(CONTRACT_TOKEN);
      const response = await withMockServerFetch(mockServer.url, () =>
        api<Array<{ id: string; taskId: string; body: string; createdAt: string }>>(
          '/tasks/task-1/comments',
        ),
      );

      assert.ok(response.length > 0);
      assert.equal(response[0].id, 'comment-1');
      assert.equal(response[0].taskId, 'task-1');
      assert.equal(typeof response[0].body, 'string');
      assert.equal(typeof response[0].createdAt, 'string');
    });
}

async function main(): Promise<void> {
  await verifyLoginConsumerContract();
  await verifyCommentsConsumerContract();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
