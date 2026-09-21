import { NextFunction, Request, Response } from 'express';
import { db } from '../../lib/db';
import { notFound } from '../../lib/http';
import { parsePublicId, toPublicId } from '../../lib/ids';
import * as repo from './tasks.repository';
import * as service from './tasks.service';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function listByProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = parsePublicId(req.params.projectId, 'proj');
    if (projectId === null) throw notFound('Project not found');

    const assignedTo = req.query.assignedTo
      ? parsePublicId(String(req.query.assignedTo), 'user') ?? undefined
      : undefined;

    const filters: repo.TaskFilters = {
      status: req.query.status ? String(req.query.status) : undefined,
      priority: req.query.priority ? String(req.query.priority) : undefined,
      assigneeId: assignedTo,
      search: req.query.search ? String(req.query.search) : undefined,
    };

    const limit = Math.min(Number(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
    const offset = Number(req.query.offset) || 0;

    const rows = await repo.findTasks(projectId, filters);

    const assigneeIds = [...new Set(rows.flatMap((row) =>
      row.assigneeId === null ? [] : [row.assigneeId],
    ))];
    const [assignees, commentCounts] = await Promise.all([
      db.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true, email: true },
      }),
      db.comment.groupBy({
        by: ['taskId'],
        where: { taskId: { in: rows.map((row) => row.id) } },
        _count: { _all: true },
      }),
    ]);
    const assigneesById = new Map(assignees.map((user) => [user.id, user]));
    const countsByTask = new Map(commentCounts.map((count) => [count.taskId, count._count._all]));
    const items = rows.map((row) => {
      const assignee = row.assigneeId === null ? null : assigneesById.get(row.assigneeId);
      return service.serializeTask(row, {
        assignee: assignee ? { id: toPublicId('user', assignee.id), email: assignee.email } : null,
        commentCount: countsByTask.get(row.id) ?? 0,
      });
    });

    res.json({ items, total: rows.length, limit, offset });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = parsePublicId(req.params.projectId, 'proj');
    if (projectId === null) throw notFound('Project not found');
    res.status(201).json(await service.createTask(projectId, req.user!.userId, req.body ?? {}));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taskId = parsePublicId(req.params.taskId, 'task');
    if (taskId === null) throw notFound('Task not found');
    const task = await db.task.findUnique({ where: { id: taskId } });
    if (!task) throw notFound('Task not found');
    res.json(service.serializeTask(task, { tags: await service.listTags(taskId) }));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taskId = parsePublicId(req.params.taskId, 'task');
    if (taskId === null) throw notFound('Task not found');
    res.json(await service.updateTask(taskId, req.user!.userId, req.body ?? {}));
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taskId = parsePublicId(req.params.taskId, 'task');
    if (taskId === null) throw notFound('Task not found');
    await service.deleteTask(taskId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addTag(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taskId = parsePublicId(req.params.taskId, 'task');
    if (taskId === null) throw notFound('Task not found');
    res.status(201).json(await service.addTag(taskId, req.body?.name));
  } catch (err) {
    next(err);
  }
}

export async function removeTag(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taskId = parsePublicId(req.params.taskId, 'task');
    const tagId = parsePublicId(req.params.tagId, 'tag');
    if (taskId === null || tagId === null) throw notFound('Task not found');
    await service.removeTag(taskId, tagId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function history(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const taskId = parsePublicId(req.params.taskId, 'task');
    if (taskId === null) throw notFound('Task not found');
    const rows = await db.taskHistory.findMany({
      where: { taskId },
      orderBy: { id: 'asc' },
    });
    res.json(
      rows.map((r) => ({
        id: r.id,
        taskId: toPublicId('task', r.taskId),
        changedBy: toPublicId('user', r.changedById),
        fromStatus: r.fromStatus,
        toStatus: r.toStatus,
        changedAt: r.changedAt.toISOString(),
      })),
    );
  } catch (err) {
    next(err);
  }
}
