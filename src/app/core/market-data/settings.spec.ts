import {
  clampSettings,
  DEFAULT_SETTINGS,
  nominalRate,
  type ProducerSettings,
  SETTINGS_LIMITS,
} from './settings';

describe('producer settings', () => {
  it('uses the limits from the task', () => {
    expect(SETTINGS_LIMITS).toEqual({
      instrumentCount: { min: 1, max: 50 },
      updatesPerBatch: { min: 1, max: 1000 },
      intervalMs: { min: 50, max: 2000 },
    });
  });

  it('uses the defaults from the task, all within the limits', () => {
    expect(DEFAULT_SETTINGS).toEqual({ instrumentCount: 5, updatesPerBatch: 100, intervalMs: 500 });

    for (const key of Object.keys(SETTINGS_LIMITS) as (keyof ProducerSettings)[]) {
      expect(DEFAULT_SETTINGS[key]).toBeGreaterThanOrEqual(SETTINGS_LIMITS[key].min);
      expect(DEFAULT_SETTINGS[key]).toBeLessThanOrEqual(SETTINGS_LIMITS[key].max);
    }
  });

  describe('nominalRate', () => {
    it('is updates per second across all instruments (100 every 500 ms = 200/s)', () => {
      expect(nominalRate(DEFAULT_SETTINGS)).toBe(200);
    });

    it('covers the maximum load (1,000 every 50 ms = 20,000/s)', () => {
      expect(nominalRate({ instrumentCount: 50, updatesPerBatch: 1000, intervalMs: 50 })).toBe(
        20_000,
      );
    });
  });

  describe('clampSettings', () => {
    it('keeps valid settings unchanged', () => {
      const valid = { instrumentCount: 50, updatesPerBatch: 1, intervalMs: 2000 };

      expect(clampSettings(valid)).toEqual(valid);
    });

    it('raises values below the minimum and lowers values above the maximum', () => {
      expect(clampSettings({ instrumentCount: 0, updatesPerBatch: 5000, intervalMs: 10 })).toEqual({
        instrumentCount: 1,
        updatesPerBatch: 1000,
        intervalMs: 50,
      });
    });

    it('drops the fractional part', () => {
      expect(
        clampSettings({ instrumentCount: 1.5, updatesPerBatch: 99.9, intervalMs: 500.4 }),
      ).toEqual({ instrumentCount: 1, updatesPerBatch: 99, intervalMs: 500 });
    });

    it('falls back to the default for values that are not finite numbers', () => {
      expect(
        clampSettings({ instrumentCount: NaN, updatesPerBatch: Infinity, intervalMs: -Infinity }),
      ).toEqual(DEFAULT_SETTINGS);
    });
  });
});
