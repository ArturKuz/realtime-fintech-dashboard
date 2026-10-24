import { BatchScheduler } from './batch-scheduler';

const INTERVAL = 500;

describe('BatchScheduler', () => {
  let runBatch: ReturnType<typeof vi.fn<() => void>>;
  let scheduler: BatchScheduler;

  beforeEach(() => {
    vi.useFakeTimers();
    runBatch = vi.fn<() => void>();
    scheduler = new BatchScheduler(() => runBatch(), INTERVAL);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs the first batch immediately on start, then one per interval', () => {
    scheduler.start();
    expect(runBatch).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(INTERVAL - 1);
    expect(runBatch).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(runBatch).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(INTERVAL * 3);
    expect(runBatch).toHaveBeenCalledTimes(5);
  });

  it('schedules the next batch only after the current one finished (no overlap)', () => {
    const pendingTimersDuringBatch: number[] = [];
    runBatch.mockImplementation(() => pendingTimersDuringBatch.push(vi.getTimerCount()));

    scheduler.start();
    vi.advanceTimersByTime(INTERVAL * 3);

    expect(pendingTimersDuringBatch).toEqual([0, 0, 0, 0]);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('generates nothing while paused, however long the pause', () => {
    scheduler.start();
    scheduler.pause();

    vi.advanceTimersByTime(INTERVAL * 20);

    expect(runBatch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('resumes one interval later without catching up on the paused time', () => {
    scheduler.start();
    scheduler.pause();
    vi.advanceTimersByTime(INTERVAL * 20);

    scheduler.resume();
    expect(runBatch).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(INTERVAL - 1);
    expect(runBatch).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(runBatch).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(INTERVAL);
    expect(runBatch).toHaveBeenCalledTimes(3);
  });

  it('never starts a second chain when resume is called while running', () => {
    scheduler.start();
    scheduler.resume();
    scheduler.resume();

    vi.advanceTimersByTime(INTERVAL * 4);

    expect(runBatch).toHaveBeenCalledTimes(5);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('ignores a second start', () => {
    scheduler.start();
    scheduler.start();

    expect(runBatch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('can be resumed before it was ever started (paused from the beginning)', () => {
    scheduler.resume();
    expect(runBatch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(INTERVAL);
    expect(runBatch).toHaveBeenCalledTimes(1);
  });

  it('stops for good: no batches and no resume after stop', () => {
    scheduler.start();
    scheduler.stop();
    scheduler.resume();

    vi.advanceTimersByTime(INTERVAL * 5);

    expect(runBatch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ends the chain when a batch stops the scheduler', () => {
    runBatch.mockImplementation(() => scheduler.stop());

    scheduler.start();
    vi.advanceTimersByTime(INTERVAL * 5);

    expect(runBatch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ends the chain when a batch throws', () => {
    runBatch.mockImplementation(() => {
      throw new Error('boom');
    });

    expect(() => scheduler.start()).toThrow('boom');
    vi.advanceTimersByTime(INTERVAL * 5);

    expect(runBatch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
