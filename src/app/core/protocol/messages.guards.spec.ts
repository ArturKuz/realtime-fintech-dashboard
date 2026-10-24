import { WORKED_EXAMPLE_SNAPSHOT_ROW } from '@testing/snapshot-row.fixtures';
import { isWorkerMessage } from './messages.guards';

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
