import { max, min, required, type SchemaPathTree, validate } from '@angular/forms/signals';
import { SETTINGS_LIMITS } from '@core/market-data/settings.constants';
import { type SettingKey } from '@core/market-data/settings.model';
import { integerError } from '@shared/forms/validators.utils';
import { type SettingsDraft } from './settings-form.model';

/** Every setting: required, a whole number, within SETTINGS_LIMITS (the same limits the worker enforces). */
export function settingsSchema(path: SchemaPathTree<SettingsDraft>): void {
  for (const key of Object.keys(SETTINGS_LIMITS) as SettingKey[]) {
    const field = path[key];
    required(field);
    min(field, SETTINGS_LIMITS[key].min);
    max(field, SETTINGS_LIMITS[key].max);
    validate(field, ({ value }) => integerError(value()));
  }
}
