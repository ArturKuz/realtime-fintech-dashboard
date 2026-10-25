/** Plain-language errors about the worker itself; errors from inside the worker arrive as text. */
export const MARKET_DATA_ERRORS = {
  workerUnavailable:
    'This browser could not start the background worker, so market data cannot be generated.',
  workerFailed:
    'The background worker could not start or stopped unexpectedly. Apply the settings again to retry.',
} as const;
