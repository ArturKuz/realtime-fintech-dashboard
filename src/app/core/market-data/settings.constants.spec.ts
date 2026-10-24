import { DEFAULT_SETTINGS, SETTINGS_LIMITS } from './settings.constants';
import { type SettingKey } from './settings.model';

describe('settings constants', () => {
  it('uses the limits from the task', () => {
    expect(SETTINGS_LIMITS).toEqual({
      instrumentCount: { min: 1, max: 50 },
      updatesPerBatch: { min: 1, max: 1000 },
      intervalMs: { min: 50, max: 2000 },
    });
  });

  it('uses the defaults from the task, all within the limits', () => {
    expect(DEFAULT_SETTINGS).toEqual({ instrumentCount: 5, updatesPerBatch: 100, intervalMs: 500 });

    for (const key of Object.keys(SETTINGS_LIMITS) as SettingKey[]) {
      expect(DEFAULT_SETTINGS[key]).toBeGreaterThanOrEqual(SETTINGS_LIMITS[key].min);
      expect(DEFAULT_SETTINGS[key]).toBeLessThanOrEqual(SETTINGS_LIMITS[key].max);
    }
  });
});
