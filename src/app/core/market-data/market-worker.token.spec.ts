import { TestBed } from '@angular/core/testing';
import { type MarketWorker, type MarketWorkerListener } from './market-worker.model';
import { MARKET_WORKER_FACTORY } from './market-worker.token';

/** Just enough of the DOM Worker for the adapter; records how it was created and used. */
class StubWorker {
  static created: StubWorker[] = [];

  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;
  readonly postMessage = vi.fn<(data: unknown) => void>();
  readonly terminate = vi.fn<() => void>();

  constructor(
    readonly url: URL,
    readonly options: WorkerOptions,
  ) {
    StubWorker.created.push(this);
  }
}

describe('MARKET_WORKER_FACTORY (browser adapter)', () => {
  const message = vi.fn<(data: unknown) => void>();
  const failure = vi.fn<() => void>();
  const listener: MarketWorkerListener = { message, failure };

  beforeEach(() => {
    StubWorker.created = [];
    message.mockClear();
    failure.mockClear();
    vi.stubGlobal('Worker', StubWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function createWorker(): { adapter: MarketWorker; worker: StubWorker } {
    const adapter = TestBed.inject(MARKET_WORKER_FACTORY)(listener);
    const worker = StubWorker.created.at(-1);
    if (worker === undefined) {
      throw new Error('The factory did not create a Worker');
    }
    return { adapter, worker };
  }

  it('creates one module worker', () => {
    const { worker } = createWorker();

    expect(StubWorker.created).toHaveLength(1);
    expect(worker.options).toEqual({ type: 'module' });
  });

  it('forwards commands and terminate to the worker', () => {
    const { adapter, worker } = createWorker();

    adapter.post({ type: 'pause' });
    adapter.terminate();

    expect(worker.postMessage).toHaveBeenCalledExactlyOnceWith({ type: 'pause' });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('passes message data to the listener', () => {
    const { worker } = createWorker();

    worker.onmessage?.(new MessageEvent('message', { data: { type: 'ready', runId: 1 } }));

    expect(message).toHaveBeenCalledExactlyOnceWith({ type: 'ready', runId: 1 });
  });

  it('reports error and messageerror events as a failure', () => {
    const { worker } = createWorker();

    worker.onerror?.(new Event('error'));
    worker.onmessageerror?.(new MessageEvent('messageerror'));

    expect(failure).toHaveBeenCalledTimes(2);
    expect(message).not.toHaveBeenCalled();
  });
});
