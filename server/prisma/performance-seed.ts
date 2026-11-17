import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Only the dedicated performance database may be reset by this script.
if (process.env.DATABASE_URL !== 'file:./performance.db') {
  throw new Error('DATABASE_URL must be file:./performance.db');
}
const db = new PrismaClient();
const large = process.argv.includes('--large');

async function main() {
  await db.taskTag.deleteMany();
  await db.tag.deleteMany();
  await db.comment.deleteMany();
  await db.taskHistory.deleteMany();
  await db.task.deleteMany();
  await db.projectMember.deleteMany();
  await db.project.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.user.deleteMany();
  const user = await db.user.create({ data: { email: 'performance@test.com', name: 'Performance', passwordHash: await bcrypt.hash('Password1', 10) } });
  const project = await db.project.create({ data: { name: 'Performance', ownerId: user.id, members: { create: { userId: user.id, role: 'OWNER' } } } });
  const taskCount = large ? 5000 : 12;
  await db.task.createMany({ data: Array.from({ length: taskCount }, (_, i) => ({ projectId: project.id, title: `Tarea ${i + 1}`, assigneeId: user.id })) });
  const tasks = await db.task.findMany({ where: { projectId: project.id }, select: { id: true }, orderBy: { id: 'asc' } });
  const commentCount = large ? 20000 : 5;
  for (let start = 0; start < commentCount; start += 500) {
    await db.comment.createMany({ data: Array.from({ length: Math.min(500, commentCount - start) }, (_, i) => ({ taskId: tasks[(start + i) % tasks.length].id, authorId: user.id, body: 'Comentario de prueba' })) });
  }
  console.log(JSON.stringify({ projectId: `proj-${project.id}`, tasks: taskCount, comments: commentCount }));
}
main().finally(() => db.$disconnect());
