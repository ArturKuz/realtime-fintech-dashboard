import { InjectionToken } from '@angular/core';
import {
  type MarketWorker,
  type MarketWorkerFactory,
  type MarketWorkerListener,
} from './market-worker.model';

/** Creates the producer worker. Tests provide a fake, so no real worker or Wasm is needed. */
export const MARKET_WORKER_FACTORY = new InjectionToken<MarketWorkerFactory>(
  'MARKET_WORKER_FACTORY',
  { factory: () => createBrowserMarketWorker },
);

/** Adapter: hides the DOM Worker API (events, postMessage) behind the small MarketWorker interface. */
function createBrowserMarketWorker(listener: MarketWorkerListener): MarketWorker {
  // Written out literally: the Angular builder only bundles a worker from this exact pattern with a
  // relative path (path aliases do not work inside `new URL`).
  const worker = new Worker(new URL('../../worker/market.worker', import.meta.url), {
    type: 'module',
  });
  worker.onmessage = (event: MessageEvent<unknown>) => listener.message(event.data);
  worker.onerror = () => listener.failure();
  worker.onmessageerror = () => listener.failure();
  return {
    post: (command) => worker.postMessage(command),
    terminate: () => worker.terminate(),
  };
}
