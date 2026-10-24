/**
 * idle: created, nothing scheduled yet · running: a batch is scheduled · paused: nothing scheduled,
 * resumable · stopped: finished for good.
 */
export type SchedulerState = 'idle' | 'running' | 'paused' | 'stopped';
