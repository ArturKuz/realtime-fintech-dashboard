import {
  type MarketWorker,
  type MarketWorkerFactory,
  type MarketWorkerListener,
} from '@core/market-data/market-worker.model';
import { type WorkerCommand } from '@core/protocol/messages.model';

/** Stands in for the producer worker: records commands and lets a test send its replies. */
export class FakeMarketWorker implements MarketWorker {
  readonly post = vi.fn<(command: WorkerCommand) => void>();
  readonly terminate = vi.fn<() => void>();

  constructor(private readonly listener: MarketWorkerListener) {}

  /** Delivers `data` as if the worker had posted it (untyped, like a real message). */
  emit(data: unknown): void {
    this.listener.message(data);
  }

  /** Simulates the worker's error / messageerror event. */
  fail(): void {
    this.listener.failure();
  }
}

/** Provide `create` as MARKET_WORKER_FACTORY; every worker the app creates is kept in order. */
export class FakeMarketWorkerFactory {
  readonly workers: FakeMarketWorker[] = [];

  readonly create: MarketWorkerFactory = (listener) => {
    const worker = new FakeMarketWorker(listener);
    this.workers.push(worker);
    return worker;
  };

  get latest(): FakeMarketWorker {
    const worker = this.workers.at(-1);
    if (worker === undefined) {
      throw new Error('No worker has been created yet');
    }
    return worker;
  }
}
