import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { type SettingKey } from '@core/market-data/settings.model';
import { settingsSchema } from './settings-form';
import { type SettingsDraft } from './settings-form.model';

const VALID: SettingsDraft = { instrumentCount: 5, updatesPerBatch: 100, intervalMs: 500 };

/** Error kinds for one setting when every other setting is valid. */
function errorKinds(key: SettingKey, value: number | null): string[] {
  return TestBed.runInInjectionContext(() => {
    const settings = form(signal<SettingsDraft>({ ...VALID, [key]: value }), settingsSchema);
    return settings[key]()
      .errors()
      .map((error) => error.kind);
  });
}

describe('settingsSchema', () => {
  it('accepts the defaults', () => {
    const valid = TestBed.runInInjectionContext(() =>
      form(signal<SettingsDraft>({ ...VALID }), settingsSchema)().valid(),
    );

    expect(valid).toBe(true);
  });

  it.each<[SettingKey, number, number, number, number]>([
    // key, below min, min, max, above max
    ['instrumentCount', 0, 1, 50, 51],
    ['updatesPerBatch', 0, 1, 1000, 1001],
    ['intervalMs', 49, 50, 2000, 2001],
  ])('limits %s to the task range', (key, belowMin, minValue, maxValue, aboveMax) => {
    expect(errorKinds(key, belowMin)).toEqual(['min']);
    expect(errorKinds(key, minValue)).toEqual([]);
    expect(errorKinds(key, maxValue)).toEqual([]);
    expect(errorKinds(key, aboveMax)).toEqual(['max']);
  });

  it.each<[SettingKey, number]>([
    // key, a fraction inside the range
    ['instrumentCount', 1.5],
    ['updatesPerBatch', 1.5],
    ['intervalMs', 100.5],
  ])('requires a whole number for %s', (key, fraction) => {
    expect(errorKinds(key, null)).toEqual(['required']);
    expect(errorKinds(key, fraction)).toEqual(['integer']);
  });
});
