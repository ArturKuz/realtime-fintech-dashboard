/**
 * Weight of the newest measurement in the smoothed rate (exponential moving average).
 * 0.3 follows real changes within a few batches while one slow batch only nudges the value.
 */
export const RATE_SMOOTHING = 0.3;
