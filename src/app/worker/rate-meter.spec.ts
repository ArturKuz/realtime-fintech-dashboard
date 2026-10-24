import { RateMeter } from './rate-meter';

describe('RateMeter', () => {
  let time: number;
  let meter: RateMeter;

  beforeEach(() => {
    time = 0;
    meter = new RateMeter(() => time);
  });

  function batchAfter(ms: number, updates: number): void {
    time += ms;
    meter.record(updates);
  }

  it('has no rate before there are two batches to compare', () => {
    expect(meter.rate).toBeNull();

    meter.record(100);

    expect(meter.rate).toBeNull();
  });

  it('measures updates per second from the time between batches (100 every 500 ms = 200/s)', () => {
    meter.record(100);
    batchAfter(500, 100);

    expect(meter.rate).toBe(200);

    batchAfter(500, 100);
    expect(meter.rate).toBe(200);
  });

  it('shows a lower rate when batches arrive later than requested', () => {
    meter.record(100);
    batchAfter(1000, 100);

    expect(meter.rate).toBe(100);
  });

  it('smooths changes instead of jumping on a single slow batch', () => {
    meter.record(100);
    batchAfter(500, 100); // 200/s

    batchAfter(1000, 100); // one slow batch: 100/s

    expect(meter.rate).toBeLessThan(200);
    expect(meter.rate).toBeGreaterThan(100);
  });

  it('ignores the paused gap after a reset, keeping the last rate until the next measurement', () => {
    meter.record(100);
    batchAfter(500, 100);

    meter.reset();
    batchAfter(60_000, 100); // first batch after resume: no gap is measured
    expect(meter.rate).toBe(200);

    batchAfter(500, 100);
    expect(meter.rate).toBe(200);
  });
});
