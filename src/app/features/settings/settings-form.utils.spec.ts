import { toProducerSettings } from './settings-form.utils';

describe('toProducerSettings', () => {
  it('turns a complete draft into settings', () => {
    expect(
      toProducerSettings({ instrumentCount: 3, updatesPerBatch: 1000, intervalMs: 50 }),
    ).toEqual({ instrumentCount: 3, updatesPerBatch: 1000, intervalMs: 50 });
  });

  it('returns null while any setting is empty', () => {
    expect(
      toProducerSettings({ instrumentCount: 3, updatesPerBatch: null, intervalMs: 50 }),
    ).toBeNull();
  });
});
