import { createHmac } from 'node:crypto';
import { MatchersV3, PactV3 } from '@pact-foundation/pact';
import { api, setToken } from '../../client/src/lib/api';
import type { Project } from '../../client/src/types';
import { describe, expect, it } from 'vitest';
import path from 'node:path';

const { eachLike, like, regex } = MatchersV3;
const pact = new PactV3({
  consumer: 'TaskFlowWeb',
  provider: 'TaskFlowAPI',
  dir: path.resolve(process.cwd(), 'contract-tests/pacts'),
});
const JWT_HEADER = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
const JWT_PAYLOAD = Buffer.from(JSON.stringify({ userId: 1, email: 'ana@test.com' })).toString(
  'base64url',
);
const TOKEN_BODY = `${JWT_HEADER}.${JWT_PAYLOAD}`;
const CONTRACT_TOKEN = `${TOKEN_BODY}.${createHmac('sha256', 'test-secret')
  .update(TOKEN_BODY)
  .digest('base64url')}`;

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

describe('Contrato de consumidor: proyectos', () => {
  it('obtiene la lista de proyectos de Ana', async () => {
    await pact
      .addInteraction({
        states: [{ description: 'Ana tiene al menos un proyecto activo' }],
        uponReceiving: 'la lista de proyectos de Ana',
        withRequest: {
          method: 'GET',
          path: '/api/projects',
          headers: { Authorization: like(`Bearer ${CONTRACT_TOKEN}`) },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': regex(/^application\/json.*$/, 'application/json; charset=utf-8'),
          },
          body: eachLike(
            {
              id: like('proj-1'),
              name: like('Rediseño del sitio'),
              description: like('Renovación completa del sitio institucional'),
              ownerId: like('user-1'),
              archived: like(false),
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
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (input, init) =>
          originalFetch(new URL(String(input), mockServer.url), init);

        try {
          const projects = await api<Project[]>('/projects');

          expect(projects.length).toBeGreaterThan(0);
          expect(projects[0]).toEqual(
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              description: expect.any(String),
              ownerId: expect.any(String),
              archived: false,
              createdAt: expect.any(String),
            }),
          );
        } finally {
          globalThis.fetch = originalFetch;
        }
      });
  });
});
