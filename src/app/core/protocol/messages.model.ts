import { type ProducerSettings } from '@core/market-data/settings.model';

// Angular → worker

export interface StartCommand extends ProducerSettings {
  readonly type: 'start';
  readonly runId: number;
  /** Seed for the generator's PRNG: fixed in tests, random per run in the app. */
  readonly seed: number;
}

export interface PauseCommand {
  readonly type: 'pause';
}

export interface ResumeCommand {
  readonly type: 'resume';
}

export type WorkerCommand = StartCommand | PauseCommand | ResumeCommand;

// Worker → Angular. Every message carries the runId of the run that produced it.

/** Current metrics of one instrument. `null` means "unavailable" (no data or zero denominator). */
export interface SnapshotRow {
  readonly instrument: number;
  readonly lastPriceCents: number | null;
  readonly spreadCents: number | null;
  /** Cumulative traded quantity since the run started. */
  readonly volume: bigint;
  /** Unrounded; rounded to cents only for display. */
  readonly vwapCents: number | null;
  /** In [-1, +1]. */
  readonly imbalance: number | null;
}

export interface ReadyMessage {
  readonly type: 'ready';
  readonly runId: number;
}

export interface SnapshotMessage {
  readonly type: 'snapshot';
  readonly runId: number;
  readonly rows: readonly SnapshotRow[];
  /** Measured updates per second; null until it can be measured. */
  readonly actualRate: number | null;
}

export interface ProducerErrorMessage {
  readonly type: 'error';
  readonly runId: number;
  /** Plain-language text shown to the user. */
  readonly message: string;
}

export type WorkerMessage = ReadyMessage | SnapshotMessage | ProducerErrorMessage;
