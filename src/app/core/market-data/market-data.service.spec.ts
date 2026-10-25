import { TestBed } from '@angular/core/testing';
import { type SnapshotMessage, type SnapshotRow } from '@core/protocol/messages.model';
import { FakeMarketWorkerFactory } from '@testing/fake-market-worker';
import { WORKED_EXAMPLE_SNAPSHOT_ROW } from '@testing/snapshot-row.fixtures';
import { MARKET_DATA_ERRORS } from './market-data-errors.constants';
import { MarketDataService } from './market-data.service';
import { MARKET_WORKER_FACTORY } from './market-worker.token';
import { SEED_SOURCE } from './seed.token';

const SEED = 42;

function snapshot(runId: number, rows: readonly SnapshotRow[], actualRate = 200): SnapshotMessage {
  return { type: 'snapshot', runId, rows, actualRate };
}

describe('MarketDataService', () => {
  let factory: FakeMarketWorkerFactory;

  function setup(): MarketDataService {
    factory = new FakeMarketWorkerFactory();
    TestBed.configureTestingModule({
      providers: [
        { provide: MARKET_WORKER_FACTORY, useValue: factory.create },
        { provide: SEED_SOURCE, useValue: () => SEED },
      ],
    });
    return TestBed.inject(MarketDataService);
  }

  /** Service with run #1 confirmed by the worker. */
  function setupRunning(): MarketDataService {
    const service = setup();
    factory.latest.emit({ type: 'ready', runId: 1 });
    return service;
  }

  describe('on creation', () => {
    it('starts run #1 with the default settings in a single worker', () => {
      const service = setup();

      expect(factory.workers).toHaveLength(1);
      expect(factory.latest.post).toHaveBeenCalledExactlyOnceWith({
        type: 'start',
        runId: 1,
        instrumentCount: 5,
        updatesPerBatch: 100,
        intervalMs: 500,
        seed: SEED,
      });
      expect(service.runId()).toBe(1);
      expect(service.appliedSettings()).toEqual({
        instrumentCount: 5,
        updatesPerBatch: 100,
        intervalMs: 500,
      });
      expect(service.nominalRate()).toBe(200);
    });

    it('shows one empty row per instrument before any data', () => {
      const service = setup();

      expect(service.status()).toBe('starting');
      expect(service.rows()).toHaveLength(5);
      expect(service.rows()[4]).toEqual({
        instrument: 4,
        lastPriceCents: null,
        spreadCents: null,
        volume: 0n,
        vwapCents: null,
        imbalance: null,
      });
      expect(service.actualRate()).toBeNull();
      expect(service.errorMessage()).toBeNull();
    });

    it('is a singleton: injecting it again creates no second worker', () => {
      const service = setup();

      expect(TestBed.inject(MarketDataService)).toBe(service);
      expect(factory.workers).toHaveLength(1);
    });
  });

  describe('messages from the worker', () => {
    it('is running once the worker reports ready', () => {
      const service = setupRunning();

      expect(service.status()).toBe('running');
    });

    it('replaces the rows and the actual rate with each snapshot', () => {
      const service = setupRunning();

      factory.latest.emit(snapshot(1, [WORKED_EXAMPLE_SNAPSHOT_ROW], 198.5));

      expect(service.rows()).toEqual([WORKED_EXAMPLE_SNAPSHOT_ROW]);
      expect(service.actualRate()).toBe(198.5);
    });

    it('ignores data that is not a valid message', () => {
      const service = setupRunning();

      factory.latest.emit({ type: 'snapshot', runId: 1 });
      factory.latest.emit('garbage');

      expect(service.rows()).toHaveLength(5);
      expect(service.status()).toBe('running');
    });
  });

  describe('apply', () => {
    const NEW_SETTINGS = { instrumentCount: 3, updatesPerBatch: 1000, intervalMs: 50 };

    it('replaces the worker: terminates the old one and starts run #2 in a new one', () => {
      const service = setupRunning();
      const first = factory.latest;

      service.apply(NEW_SETTINGS);

      expect(first.terminate).toHaveBeenCalledOnce();
      expect(factory.workers).toHaveLength(2);
      expect(factory.latest.post).toHaveBeenCalledExactlyOnceWith({
        type: 'start',
        runId: 2,
        ...NEW_SETTINGS,
        seed: SEED,
      });
      expect(service.runId()).toBe(2);
      expect(service.appliedSettings()).toEqual(NEW_SETTINGS);
      expect(service.nominalRate()).toBe(20000);
    });

    it('clears all values and totals of the previous run', () => {
      const service = setupRunning();
      factory.latest.emit(snapshot(1, [WORKED_EXAMPLE_SNAPSHOT_ROW]));

      service.apply(NEW_SETTINGS);

      expect(service.rows()).toHaveLength(3);
      expect(service.rows().every((row) => row.volume === 0n && row.lastPriceCents === null)).toBe(
        true,
      );
      expect(service.actualRate()).toBeNull();
      expect(service.status()).toBe('starting');
    });

    it('starts generating even if the previous run was paused', () => {
      const service = setupRunning();
      service.pause();

      service.apply(NEW_SETTINGS);
      expect(service.status()).toBe('starting');
      expect(factory.latest.post).not.toHaveBeenCalledWith({ type: 'pause' });

      factory.latest.emit({ type: 'ready', runId: 2 });
      expect(service.status()).toBe('running');
    });

    it('rejects messages that belong to the previous run', () => {
      const service = setupRunning();
      const first = factory.latest;
      service.apply(NEW_SETTINGS);

      first.emit(snapshot(1, [WORKED_EXAMPLE_SNAPSHOT_ROW]));
      first.emit({ type: 'ready', runId: 1 });
      first.emit({ type: 'error', runId: 1, message: 'old failure' });

      expect(service.rows()).toHaveLength(3);
      expect(service.rows()[0]?.volume).toBe(0n);
      expect(service.status()).toBe('starting');
      expect(service.errorMessage()).toBeNull();
    });

    it('ignores a failure event from a worker that has already been replaced', () => {
      const service = setupRunning();
      const first = factory.latest;
      service.apply(NEW_SETTINGS);

      first.fail();

      expect(service.status()).toBe('starting');
    });

    it('applies settings within the limits, so the rows match what the worker generates', () => {
      const service = setup();

      service.apply({ instrumentCount: 80, updatesPerBatch: 0, intervalMs: 10.7 });

      expect(service.appliedSettings()).toEqual({
        instrumentCount: 50,
        updatesPerBatch: 1,
        intervalMs: 50,
      });
      expect(service.rows()).toHaveLength(50);
    });

    it('recovers from an error with a new run', () => {
      const service = setupRunning();
      factory.latest.emit({ type: 'error', runId: 1, message: 'Boom.' });

      service.apply(NEW_SETTINGS);

      expect(service.status()).toBe('starting');
      expect(service.errorMessage()).toBeNull();
      factory.latest.emit({ type: 'ready', runId: 2 });
      expect(service.status()).toBe('running');
    });
  });

  describe('pause and resume', () => {
    it('pause tells the worker and shows paused at once', () => {
      const service = setupRunning();

      service.pause();

      expect(factory.latest.post).toHaveBeenLastCalledWith({ type: 'pause' });
      expect(service.status()).toBe('paused');
    });

    it('resume tells the worker and shows running at once', () => {
      const service = setupRunning();
      service.pause();

      service.resume();

      expect(factory.latest.post).toHaveBeenLastCalledWith({ type: 'resume' });
      expect(service.status()).toBe('running');
    });

    it('accepts a snapshot of the same run that arrives after pause', () => {
      const service = setupRunning();
      service.pause();

      factory.latest.emit(snapshot(1, [WORKED_EXAMPLE_SNAPSHOT_ROW]));

      expect(service.rows()).toEqual([WORKED_EXAMPLE_SNAPSHOT_ROW]);
      expect(service.status()).toBe('paused');
    });

    it('does nothing when the action does not fit the current status', () => {
      const service = setup(); // starting

      service.pause();
      service.resume();
      expect(service.status()).toBe('starting');

      factory.latest.emit({ type: 'ready', runId: 1 });
      service.resume(); // running, not paused
      expect(service.status()).toBe('running');
      expect(factory.latest.post).toHaveBeenCalledOnce(); // only start
    });
  });

  describe('errors', () => {
    it('shows the message the worker reports and stops its worker', () => {
      const service = setupRunning();

      factory.latest.emit({ type: 'error', runId: 1, message: 'The generator could not load.' });

      expect(service.status()).toBe('error');
      expect(service.errorMessage()).toBe('The generator could not load.');
      expect(factory.latest.terminate).toHaveBeenCalledOnce();
    });

    it('shows a plain message when the worker fails or crashes', () => {
      const service = setupRunning();

      factory.latest.fail();

      expect(service.status()).toBe('error');
      expect(service.errorMessage()).toBe(MARKET_DATA_ERRORS.workerFailed);
      expect(factory.latest.terminate).toHaveBeenCalledOnce();
    });

    it('shows a plain message when the browser cannot create the worker', () => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: MARKET_WORKER_FACTORY,
            useValue: () => {
              throw new ReferenceError('Worker is not defined');
            },
          },
        ],
      });

      const service = TestBed.inject(MarketDataService);

      expect(service.status()).toBe('error');
      expect(service.errorMessage()).toBe(MARKET_DATA_ERRORS.workerUnavailable);
    });

    it('ignores later messages once the run has failed', () => {
      const service = setupRunning();
      factory.latest.fail();

      factory.latest.emit(snapshot(1, [WORKED_EXAMPLE_SNAPSHOT_ROW]));
      factory.latest.emit({ type: 'ready', runId: 1 });

      expect(service.status()).toBe('error');
      expect(service.rows()).toHaveLength(5);
    });

    it('cannot be paused while in error', () => {
      const service = setupRunning();
      factory.latest.fail();

      service.pause();

      expect(service.status()).toBe('error');
    });
  });

  it('terminates the worker when the service is destroyed', () => {
    setup();
    const worker = factory.latest;

    TestBed.resetTestingModule();

    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
