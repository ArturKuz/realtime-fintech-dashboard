import { clampSettings } from '@core/market-data/settings.utils';
import { type StartCommand, type WorkerCommand } from '@core/protocol/messages.model';
import { aggregateBatch, createMarketState, toSnapshotRows } from './aggregator';
import { type MarketState } from './aggregator.model';
import { BatchScheduler } from './batch-scheduler';
import { GeneratorLoadError } from './generator-load-error';
import { type MarketGenerator } from './generator.model';
import { type MarketWorkerRuntimeDeps } from './market-worker-runtime.model';
import { RateMeter } from './rate-meter';
import { PRODUCER_ERRORS } from './worker-errors.constants';

/**
 * The worker's logic, free of worker globals so it can be unit-tested: loads the generator, runs
 * batches on a schedule, aggregates every update and posts one snapshot per batch.
 * One instance serves exactly one run; the app replaces the whole worker for a new run.
 */
export class MarketWorkerRuntime {
  private started = false;
  private pausedBeforeReady = false;
  private scheduler: BatchScheduler | null = null;
  private readonly rateMeter: RateMeter;

  constructor(private readonly deps: MarketWorkerRuntimeDeps) {
    this.rateMeter = new RateMeter(deps.now);
  }

  handle(command: WorkerCommand): void {
    switch (command.type) {
      case 'start':
        void this.start(command);
        break;
      case 'pause':
        this.pause();
        break;
      case 'resume':
        this.resume();
        break;
    }
  }

  private async start(command: StartCommand): Promise<void> {
    if (this.started) {
      return;
    }
    this.started = true;
    const { runId, seed } = command;
    const settings = clampSettings(command);

    let generator: MarketGenerator;
    try {
      generator = await this.deps.loadGenerator();
      generator.init(settings.instrumentCount, seed);
    } catch (error) {
      const message =
        error instanceof GeneratorLoadError ? error.message : PRODUCER_ERRORS.startFailed;
      this.deps.post({ type: 'error', runId, message });
      return;
    }

    let state: MarketState = createMarketState(settings.instrumentCount);
    const scheduler = new BatchScheduler(() => {
      try {
        state = aggregateBatch(state, generator.generate(settings.updatesPerBatch));
        this.rateMeter.record(settings.updatesPerBatch);
        this.deps.post({
          type: 'snapshot',
          runId,
          rows: toSnapshotRows(state),
          actualRate: this.rateMeter.rate,
        });
      } catch {
        scheduler.stop();
        this.deps.post({ type: 'error', runId, message: PRODUCER_ERRORS.crashed });
      }
    }, settings.intervalMs);
    this.scheduler = scheduler;

    this.deps.post({ type: 'ready', runId });
    if (this.pausedBeforeReady) {
      return; // stays idle; resume() starts it one interval later
    }
    scheduler.start();
  }

  private pause(): void {
    if (this.scheduler === null) {
      this.pausedBeforeReady = this.started;
      return;
    }
    this.scheduler.pause();
  }

  private resume(): void {
    if (this.scheduler === null) {
      this.pausedBeforeReady = false;
      return;
    }
    this.rateMeter.reset();
    this.scheduler.resume();
  }
}
