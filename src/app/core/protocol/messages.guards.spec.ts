import { WORKED_EXAMPLE_SNAPSHOT_ROW } from '@testing/snapshot-row.fixtures';
import { isWorkerCommand, isWorkerMessage } from './messages.guards';

describe('isWorkerCommand', () => {
  const start = {
    type: 'start',
    runId: 1,
    instrumentCount: 5,
    updatesPerBatch: 100,
    intervalMs: 500,
    seed: 42,
  };

  it('accepts every command the app sends', () => {
    expect(isWorkerCommand(start)).toBe(true);
    expect(isWorkerCommand({ type: 'pause' })).toBe(true);
    expect(isWorkerCommand({ type: 'resume' })).toBe(true);
  });

  it('rejects non-objects, unknown types and messages sent the other way', () => {
    for (const value of [null, undefined, 'start', 1]) {
      expect(isWorkerCommand(value)).toBe(false);
    }
    expect(isWorkerCommand({ type: 'stop' })).toBe(false);
    expect(isWorkerCommand({ type: 'ready', runId: 1 })).toBe(false);
  });

  it('rejects a start command with a missing or non-numeric field', () => {
    for (const field of ['runId', 'instrumentCount', 'updatesPerBatch', 'intervalMs', 'seed']) {
      expect(isWorkerCommand({ ...start, [field]: undefined })).toBe(false);
      expect(isWorkerCommand({ ...start, [field]: '5' })).toBe(false);
    }
  });
});

describe('isWorkerMessage', () => {
  it('accepts every message type the worker sends', () => {
    expect(isWorkerMessage({ type: 'ready', runId: 1 })).toBe(true);
    expect(
      isWorkerMessage({
        type: 'snapshot',
        runId: 1,
        rows: [WORKED_EXAMPLE_SNAPSHOT_ROW],
        actualRate: 199.5,
      }),
    ).toBe(true);
    expect(isWorkerMessage({ type: 'snapshot', runId: 1, rows: [], actualRate: null })).toBe(true);
    expect(isWorkerMessage({ type: 'error', runId: 1, message: 'The generator failed.' })).toBe(
      true,
    );
  });

  it('rejects values that are not objects', () => {
    for (const value of [null, undefined, 42, 'ready', true]) {
      expect(isWorkerMessage(value)).toBe(false);
    }
  });

  it('rejects unknown types and commands sent the other way', () => {
    expect(isWorkerMessage({ type: 'unknown', runId: 1 })).toBe(false);
    expect(isWorkerMessage({ type: 'pause', runId: 1 })).toBe(false);
  });

  it('rejects messages without a numeric runId', () => {
    expect(isWorkerMessage({ type: 'ready' })).toBe(false);
    expect(isWorkerMessage({ type: 'ready', runId: '1' })).toBe(false);
  });

  it('rejects a snapshot without rows or an error without text', () => {
    expect(isWorkerMessage({ type: 'snapshot', runId: 1, actualRate: null })).toBe(false);
    expect(isWorkerMessage({ type: 'error', runId: 1 })).toBe(false);
  });
});
