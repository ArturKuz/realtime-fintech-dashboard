import { RATE_SMOOTHING } from './rate-meter.constants';

/**
 * Measures the actual generation rate. The batch interval is only "requested": timers drift and
 * batches take time, so the real rate is measured from the gaps between batches and smoothed.
 */
export class RateMeter {
  private lastBatchAt: number | null = null;
  private smoothedRate: number | null = null;

  /** @param now injected clock in milliseconds, so tests control time */
  constructor(private readonly now: () => number) {}

  /** Updates per second; null until two batches can be compared. */
  get rate(): number | null {
    return this.smoothedRate;
  }

  record(updates: number): void {
    const time = this.now();
    if (this.lastBatchAt !== null && time > this.lastBatchAt) {
      const latest = (updates * 1000) / (time - this.lastBatchAt);
      this.smoothedRate =
        this.smoothedRate === null
          ? latest
          : this.smoothedRate + RATE_SMOOTHING * (latest - this.smoothedRate);
    }
    this.lastBatchAt = time;
  }

  /** Forgets the last batch time, so the paused gap is not counted; the last rate is kept. */
  reset(): void {
    this.lastBatchAt = null;
  }
}
