/** Plain-language errors the worker sends to the app; the UI shows them as they are. */
export const PRODUCER_ERRORS = {
  unsupported: 'This browser does not support WebAssembly, so market data cannot be generated.',
  downloadFailed:
    'The market data generator could not be downloaded. Check your connection and reload the page.',
  invalidModule: 'The market data generator file is damaged or is not a valid WebAssembly module.',
  startFailed: 'The market data generator could not start. Apply the settings again to retry.',
  crashed:
    'The market data generator stopped unexpectedly. Apply the settings again to restart it.',
} as const;
