import { SETTINGS_LIMITS } from '@core/market-data/settings.constants';
import { SETTINGS_FIELDS } from './settings-form.constants';

describe('SETTINGS_FIELDS', () => {
  it('has one labelled field per setting, in a fixed order', () => {
    expect(SETTINGS_FIELDS.map(({ key, label }) => [key, label])).toEqual([
      ['instrumentCount', 'Instruments'],
      ['updatesPerBatch', 'Updates per batch'],
      ['intervalMs', 'Interval (ms)'],
    ]);
  });

  it('covers every setting that has limits', () => {
    expect(SETTINGS_FIELDS.map((field) => field.key).sort()).toEqual(
      Object.keys(SETTINGS_LIMITS).sort(),
    );
  });
});
