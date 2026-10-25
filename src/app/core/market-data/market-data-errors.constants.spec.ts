import { MARKET_DATA_ERRORS } from './market-data-errors.constants';

describe('MARKET_DATA_ERRORS', () => {
  it('has a distinct, complete sentence for each failure', () => {
    const messages = Object.values(MARKET_DATA_ERRORS);

    expect(new Set(messages).size).toBe(messages.length);
    for (const message of messages) {
      expect(message).toMatch(/^[A-Z].*\.$/);
    }
  });

  it('tells the user how to retry after a worker failure', () => {
    expect(MARKET_DATA_ERRORS.workerFailed).toContain('Apply the settings again');
  });
});
