import { RUN_STATUS_BADGE } from './dashboard.constants';

describe('RUN_STATUS_BADGE', () => {
  it('names every producer status in words and gives it a tone', () => {
    expect(RUN_STATUS_BADGE).toEqual({
      starting: { label: 'Starting', tone: 'neutral' },
      running: { label: 'Running', tone: 'positive' },
      paused: { label: 'Paused', tone: 'neutral' },
      error: { label: 'Error', tone: 'negative' },
    });
  });
});
