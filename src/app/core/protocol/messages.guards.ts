import { type WorkerMessage } from './messages.model';

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
