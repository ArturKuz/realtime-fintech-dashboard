import { type StartCommand, type WorkerMessage } from '@core/protocol/messages.model';
import { FakeMarketGenerator } from '@testing/fake-market-generator';
import { GeneratorLoadError } from './generator-load-error';
import { type MarketGenerator } from './generator.model';
import { MarketWorkerRuntime } from './market-worker-runtime';
import { PRODUCER_ERRORS } from './worker-errors.constants';

const START: StartCommand = {
  type: 'start',
  runId: 7,
  instrumentCount: 5,
  updatesPerBatch: 100,
  intervalMs: 500,
  seed: 42,
};

describe('MarketWorkerRuntime', () => {
  let posted: WorkerMessage[];
  let generator: FakeMarketGenerator;
  let loadGenerator: ReturnType<typeof vi.fn<() => Promise<MarketGenerator>>>;
  let runtime: MarketWorkerRuntime;

  beforeEach(() => {
    vi.useFakeTimers();
    posted = [];
    generator = new FakeMarketGenerator();
    loadGenerator = vi.fn(() => Promise.resolve<MarketGenerator>(generator));
    runtime = new MarketWorkerRuntime({
      post: (message) => posted.push(message),
      loadGenerator,
      now: () => Date.now(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Lets the async Wasm load settle without moving the clock. */
  const settle = () => vi.advanceTimersByTimeAsync(0);

  const snapshots = () => posted.filter((m) => m.type === 'snapshot');

  /** Volume of instrument 0 in the latest snapshot (the fake generator trades 1 unit per update). */
  function volume(): bigint | undefined {
    return snapshots().at(-1)?.rows[0]?.volume;
  }

  it('loads the generator, posts ready, then the first snapshot at once', async () => {
    runtime.handle(START);
    await settle();

    expect(generator.init).toHaveBeenCalledWith(5, 42);
    expect(posted.map((m) => m.type)).toEqual(['ready', 'snapshot']);
    expect(generator.generate).toHaveBeenCalledWith(100);
  });

  it('posts exactly one snapshot per batch, each tagged with the run id', async () => {
    runtime.handle(START);
    await settle();
    await vi.advanceTimersByTimeAsync(500 * 3);

    expect(snapshots()).toHaveLength(4);
    expect(generator.generate).toHaveBeenCalledTimes(4);
    expect(posted.every((m) => m.runId === 7)).toBe(true);
  });

  it('sends one row per instrument with cumulative totals', async () => {
    runtime.handle(START);
    await settle();
    await vi.advanceTimersByTimeAsync(500);

    const rows = snapshots().at(-1)?.rows ?? [];
    expect(rows).toHaveLength(5);
    expect(volume()).toBe(200n); // 2 batches × 100 updates × 1 unit
  });

  it('generates nothing while paused', async () => {
    runtime.handle(START);
    await settle();
    runtime.handle({ type: 'pause' });

    await vi.advanceTimersByTimeAsync(500 * 20);

    expect(generator.generate).toHaveBeenCalledTimes(1);
    expect(snapshots()).toHaveLength(1);
  });

  it('resumes from the same totals, one interval later, without catching up', async () => {
    runtime.handle(START);
    await settle();
    await vi.advanceTimersByTimeAsync(500);
    expect(volume()).toBe(200n);

    runtime.handle({ type: 'pause' });
    await vi.advanceTimersByTimeAsync(500 * 20);
    runtime.handle({ type: 'resume' });
    await vi.advanceTimersByTimeAsync(499);
    expect(snapshots()).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(1);
    expect(snapshots()).toHaveLength(3);
    expect(volume()).toBe(300n);
  });

  it('reports the actual rate once two batches can be compared', async () => {
    runtime.handle(START);
    await settle();
    expect(snapshots()[0]?.actualRate).toBeNull();

    await vi.advanceTimersByTimeAsync(500);
    expect(snapshots()[1]?.actualRate).toBe(200);
  });

  it('clamps settings outside the limits before using them', async () => {
    runtime.handle({ ...START, instrumentCount: 0, updatesPerBatch: 5000, intervalMs: 1 });
    await settle();

    expect(generator.init).toHaveBeenCalledWith(1, 42);
    expect(generator.generate).toHaveBeenCalledWith(1000);
    await vi.advanceTimersByTimeAsync(49);
    expect(generator.generate).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(generator.generate).toHaveBeenCalledTimes(2);
  });

  it('remembers a pause that arrives while the generator is still loading', async () => {
    runtime.handle(START);
    runtime.handle({ type: 'pause' });
    await settle();

    expect(posted.map((m) => m.type)).toEqual(['ready']);
    await vi.advanceTimersByTimeAsync(500 * 5);
    expect(generator.generate).not.toHaveBeenCalled();

    runtime.handle({ type: 'resume' });
    await vi.advanceTimersByTimeAsync(500);
    expect(snapshots()).toHaveLength(1);
  });

  it('reports a load failure in plain words and never posts ready', async () => {
    loadGenerator.mockRejectedValue(new GeneratorLoadError(PRODUCER_ERRORS.downloadFailed));

    runtime.handle(START);
    await settle();

    expect(posted).toEqual([{ type: 'error', runId: 7, message: PRODUCER_ERRORS.downloadFailed }]);
  });

  it('reports an unexpected start failure with a generic plain message', async () => {
    generator.init.mockImplementation(() => {
      throw new RangeError('Instrument count must be an integer in 1..50, got 99');
    });

    runtime.handle(START);
    await settle();

    expect(posted).toEqual([{ type: 'error', runId: 7, message: PRODUCER_ERRORS.startFailed }]);
  });

  it('stops and reports when a batch fails, then generates nothing more', async () => {
    runtime.handle(START);
    await settle();
    generator.generate.mockImplementation(() => {
      throw new WebAssembly.RuntimeError('unreachable');
    });

    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(500 * 5);

    expect(posted.at(-1)).toEqual({ type: 'error', runId: 7, message: PRODUCER_ERRORS.crashed });
    expect(posted.filter((m) => m.type === 'error')).toHaveLength(1);
    expect(generator.generate).toHaveBeenCalledTimes(2);
  });

  it('ignores a second start: one worker serves exactly one run', async () => {
    runtime.handle(START);
    runtime.handle({ ...START, runId: 8 });
    await settle();

    expect(loadGenerator).toHaveBeenCalledTimes(1);
    expect(posted.every((m) => m.runId === 7)).toBe(true);
  });

  it('ignores pause and resume before any start', async () => {
    runtime.handle({ type: 'pause' });
    runtime.handle({ type: 'resume' });
    await vi.advanceTimersByTimeAsync(5000);

    expect(posted).toEqual([]);
  });
});
