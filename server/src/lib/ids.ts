/**
 * Los recursos se exponen con identificadores legibles y prefijados:
 * user-1, proj-1, task-1, comment-1.
 */

export type Prefix = 'user' | 'proj' | 'task' | 'comment' | 'tag';

export function toPublicId(prefix: Prefix, id: number): string {
  return `${prefix}-${id}`;
}

export function parsePublicId(value: unknown, prefix?: Prefix): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value !== 'string') return null;

  const raw = value.trim();
  if (raw === '') return null;

  const dash = raw.lastIndexOf('-');
  if (dash === -1) {
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : null;
  }

  const got = raw.slice(0, dash);
  if (prefix && got !== prefix) return null;

  const n = Number(raw.slice(dash + 1));
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Fecha de vencimiento: día calendario, sin hora. */
export function parseDueDate(value: unknown): Date | null | undefined {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function formatDueDate(value: Date | null): string | null {
  if (!value) return null;
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, '0');
  const d = String(value.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
