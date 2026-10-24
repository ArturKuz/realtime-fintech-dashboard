/// <reference lib="webworker" />
// Thin shell: connects the worker globals to the runtime. All logic lives in MarketWorkerRuntime.
import { isWorkerCommand } from '@core/protocol/messages.guards';
import { MarketWorkerRuntime } from './market-worker-runtime';
import { GENERATOR_WASM_PATH } from './market-worker.constants';
import { loadGenerator } from './wasm-loader';

const runtime = new MarketWorkerRuntime({
  post: (message) => self.postMessage(message),
  loadGenerator: () => loadGenerator(new URL(GENERATOR_WASM_PATH, self.location.href)),
  now: () => performance.now(),
});

self.addEventListener('message', (event: MessageEvent<unknown>) => {
  if (isWorkerCommand(event.data)) {
    runtime.handle(event.data);
  }
});
