import { type WorkerMessage } from '@core/protocol/messages.model';
import { type MarketGenerator } from './generator.model';

/** Everything the runtime needs from its environment; the worker shell provides the real ones. */
export interface MarketWorkerRuntimeDeps {
  /** Sends a message to the app (postMessage in the worker). */
  readonly post: (message: WorkerMessage) => void;
  readonly loadGenerator: () => Promise<MarketGenerator>;
  /** Clock in milliseconds (performance.now in the worker). */
  readonly now: () => number;
}
