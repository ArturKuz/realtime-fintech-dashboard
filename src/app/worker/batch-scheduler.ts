import { type SchedulerState } from './batch-scheduler.model';

/**
 * Runs batches as a setTimeout chain: the next batch is scheduled only after the current one has
 * finished. Unlike setInterval, slow batches can never overlap or queue up, and a pause simply
 * means "schedule nothing" — so nothing is generated, or caught up, for the paused time.
 */
export class BatchScheduler {
  private state: SchedulerState = 'idle';
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly runBatch: () => void,
    private readonly intervalMs: number,
  ) {}

  /** Runs the first batch immediately, then one per interval. */
  start(): void {
    if (this.state !== 'idle') {
      return;
    }
    this.state = 'running';
    this.tick();
  }

  pause(): void {
    if (this.state !== 'running') {
      return;
    }
    this.state = 'paused';
    this.clearTimer();
  }

  /** Continues one interval later. Also allowed before start (a run paused from the beginning). */
  resume(): void {
    if (this.state !== 'paused' && this.state !== 'idle') {
      return;
    }
    this.state = 'running';
    this.scheduleNext();
  }

  stop(): void {
    this.state = 'stopped';
    this.clearTimer();
  }

  private tick(): void {
    this.timer = null;
    this.runBatch();
    // The batch may have paused or stopped the scheduler; if it threw, we never get here.
    if (this.state === 'running') {
      this.scheduleNext();
    }
  }

  private scheduleNext(): void {
    this.timer = setTimeout(() => this.tick(), this.intervalMs);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
