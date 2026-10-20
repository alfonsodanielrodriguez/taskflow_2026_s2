import { Verifier } from '@pact-foundation/pact';
import { Server } from 'node:http';
import path from 'node:path';
import { createApp } from '../../server/src/app';
import { db } from '../../server/src/lib/db';

const CONTRACT_DIR = path.resolve(__dirname, '../pacts');
const PROVIDER_URL = 'http://127.0.0.1:3001';
const LOGIN_STATE = 'Ana existe con la contraseña de prueba';
const COMMENTS_STATE = 'Ana es miembro de la tarea task-1, que tiene un comentario';
const PROJECTS_STATE = 'Ana tiene al menos un proyecto activo';

function listen(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function verifySeededLoginState(): Promise<void> {
  const user = await db.user.findUnique({ where: { email: 'ana@test.com' } });
  if (!user) throw new Error('Falta Ana en la base taskflow_test; ejecutá npm run contracts:setup');
}

async function verifySeededCommentsState(): Promise<void> {
  const task = await db.task.findUnique({
    where: { id: 1 },
    include: { project: { include: { members: true } } },
  });
  const ana = await db.user.findUnique({ where: { email: 'ana@test.com' } });
  const comments = await db.comment.findMany({ where: { taskId: 1 } });
  if (
    !ana ||
    !task ||
    comments.length === 0 ||
    !task.project.members.some((member) => member.userId === ana.id)
  ) {
    throw new Error('Falta el seed de comentarios en taskflow_test; ejecutá npm run contracts:setup');
  }
}

async function verifySeededProjectsState(): Promise<void> {
  const ana = await db.user.findUnique({ where: { email: 'ana@test.com' } });
  if (!ana) throw new Error('Falta Ana en la base taskflow_test; ejecutá npm run contracts:setup');

  const project = await db.project.findFirst({
    where: { ownerId: ana.id, archived: false },
  });
  if (!project) {
    throw new Error('Falta un proyecto activo de Ana en taskflow_test; ejecutá npm run contracts:setup');
  }
}

async function main(): Promise<void> {
  const app = createApp();
  const server = app.listen(3001, '127.0.0.1');
  await listen(server);

  try {
    await new Verifier({
      provider: 'TaskFlowAPI',
      providerBaseUrl: PROVIDER_URL,
      pactUrls: [path.join(CONTRACT_DIR, 'TaskFlowWeb-TaskFlowAPI.json')],
      stateHandlers: {
        [LOGIN_STATE]: verifySeededLoginState,
        [COMMENTS_STATE]: verifySeededCommentsState,
        [PROJECTS_STATE]: verifySeededProjectsState,
      },
    }).verifyProvider();
    console.log(`TaskFlowAPI verificada correctamente en ${PROVIDER_URL}`);
  } finally {
    await close(server);
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
