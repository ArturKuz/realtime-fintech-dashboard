import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { isWorkerMessage } from '@core/protocol/messages.guards';
import { type SnapshotRow } from '@core/protocol/messages.model';
import { MARKET_DATA_ERRORS } from './market-data-errors.constants';
import { type MarketWorker } from './market-worker.model';
import { MARKET_WORKER_FACTORY } from './market-worker.token';
import { type RunStatus } from './run-state.model';
import { emptyRows } from './run-state.utils';
import { SEED_SOURCE } from './seed.token';
import { DEFAULT_SETTINGS } from './settings.constants';
import { type ProducerSettings } from './settings.model';
import { clampSettings, nominalRate } from './settings.utils';

/**
 * Facade over the market data producer. Owns the one worker, the run lifecycle and all producer
 * state; pages read the signals and call apply / pause / resume, and never see the worker.
 * Starts run #1 with the default settings as soon as it is created.
 */
@Service()
export class MarketDataService {
  private readonly createWorker = inject(MARKET_WORKER_FACTORY);
  private readonly nextSeed = inject(SEED_SOURCE);
  private worker: MarketWorker | null = null;

  private readonly _appliedSettings = signal<ProducerSettings>(DEFAULT_SETTINGS);
  private readonly _runId = signal(0);
  private readonly _status = signal<RunStatus>('starting');
  private readonly _rows = signal<readonly SnapshotRow[]>([]);
  private readonly _actualRate = signal<number | null>(null);
  private readonly _errorMessage = signal<string | null>(null);

  readonly appliedSettings = this._appliedSettings.asReadonly();
  readonly runId = this._runId.asReadonly();
  readonly status = this._status.asReadonly();
  readonly rows = this._rows.asReadonly();
  /** Measured updates per second; null until the worker can measure it. */
  readonly actualRate = this._actualRate.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  /** Requested updates per second. */
  readonly nominalRate = computed(() => nominalRate(this._appliedSettings()));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopWorker());
    this.apply(DEFAULT_SETTINGS);
  }

  /**
   * Starts a new run: replaces the worker, clears every value and total, and generates even if the
   * previous run was paused or failed.
   */
  apply(settings: ProducerSettings): void {
    this.stopWorker();
    // Same limits the worker enforces, so the shown settings and rows match what it generates.
    const applied = clampSettings(settings);
    const runId = this._runId() + 1;
    this._runId.set(runId);
    this._appliedSettings.set(applied);
    this._rows.set(emptyRows(applied.instrumentCount));
    this._actualRate.set(null);
    this._errorMessage.set(null);
    this._status.set('starting');

    try {
      this.worker = this.createWorker({
        message: (data) => this.receive(data),
        failure: () => {
          // A replaced worker's late error event must not fail the new run.
          if (runId === this._runId()) {
            this.fail(MARKET_DATA_ERRORS.workerFailed);
          }
        },
      });
    } catch {
      this.fail(MARKET_DATA_ERRORS.workerUnavailable);
      return;
    }
    this.worker.post({ type: 'start', runId, ...applied, seed: this.nextSeed() });
  }

  pause(): void {
    if (this._status() !== 'running') {
      return;
    }
    // Shown at once: the worker handles commands in order, so it will be paused next.
    this.worker?.post({ type: 'pause' });
    this._status.set('paused');
  }

  resume(): void {
    if (this._status() !== 'paused') {
      return;
    }
    this.worker?.post({ type: 'resume' });
    this._status.set('running');
  }

  private receive(data: unknown): void {
    // Terminating a worker stops new messages, but ones already queued can still arrive:
    // the runId check drops everything from earlier runs.
    if (!isWorkerMessage(data) || data.runId !== this._runId() || this._status() === 'error') {
      return;
    }
    switch (data.type) {
      case 'ready':
        this._status.update((status) => (status === 'starting' ? 'running' : status));
        break;
      case 'snapshot':
        this._rows.set(data.rows);
        this._actualRate.set(data.actualRate);
        break;
      case 'error':
        this.fail(data.message);
        break;
    }
  }

  private fail(message: string): void {
    this.stopWorker();
    this._errorMessage.set(message);
    this._status.set('error');
  }

  private stopWorker(): void {
    this.worker?.terminate();
    this.worker = null;
  }
}
