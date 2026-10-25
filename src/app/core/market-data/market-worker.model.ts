import { type WorkerCommand } from '@core/protocol/messages.model';

/** The only two things the app does with a producer worker. Adapter over the DOM `Worker`. */
export interface MarketWorker {
  post(command: WorkerCommand): void;
  terminate(): void;
}

/** What the worker reports back. `data` is untyped: it crosses the worker boundary unchecked. */
export interface MarketWorkerListener {
  message(data: unknown): void;
  /** The worker script failed to load, crashed, or sent a message that could not be read. */
  failure(): void;
}

/** Creates and starts a worker; may throw if the browser cannot create one. */
export type MarketWorkerFactory = (listener: MarketWorkerListener) => MarketWorker;
