import { type WorkerCommand, type WorkerMessage } from './messages.model';

const START_NUMBER_FIELDS = [
  'runId',
  'instrumentCount',
  'updatesPerBatch',
  'intervalMs',
  'seed',
] as const;

/** Commands arrive in the worker untyped; this confirms the type and, for start, every field. */
export function isWorkerCommand(data: unknown): data is WorkerCommand {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const command = data as Record<string, unknown>;
  switch (command['type']) {
    case 'start':
      return START_NUMBER_FIELDS.every((field) => typeof command[field] === 'number');
    case 'pause':
    case 'resume':
      return true;
    default:
      return false;
  }
}

/**
 * Data from a worker arrives untyped. This check guards the boundary: it confirms the shape the
 * service relies on (type, runId and the per-type payload), without validating every row.
 */
export function isWorkerMessage(data: unknown): data is WorkerMessage {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const message = data as Record<string, unknown>;
  if (typeof message['runId'] !== 'number') {
    return false;
  }
  switch (message['type']) {
    case 'ready':
      return true;
    case 'snapshot':
      return Array.isArray(message['rows']);
    case 'error':
      return typeof message['message'] === 'string';
    default:
      return false;
  }
}
