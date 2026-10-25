/**
 * Producer status shown to the user.
 * starting: worker created, generator loading · running / paused: generating or not ·
 * error: the run stopped; Apply starts a new one.
 */
export type RunStatus = 'starting' | 'running' | 'paused' | 'error';
