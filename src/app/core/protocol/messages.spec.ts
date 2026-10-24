import { isWorkerMessage, type SnapshotRow } from './messages';

const row: SnapshotRow = {
  instrument: 0,
  lastPriceCents: 10200,
  spreadCents: 4,
  volume: 40n,
  vwapCents: 10150,
  imbalance: 0.2,
};

describe('isWorkerMessage', () => {
  it('accepts every message type the worker sends', () => {
    expect(isWorkerMessage({ type: 'ready', runId: 1 })).toBe(true);
    expect(isWorkerMessage({ type: 'snapshot', runId: 1, rows: [row], actualRate: 199.5 })).toBe(
      true,
    );
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
