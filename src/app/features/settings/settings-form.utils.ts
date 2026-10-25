import { type ProducerSettings } from '@core/market-data/settings.model';
import { type SettingsDraft } from './settings-form.model';

/** The settings to apply, or null while a field is still empty. */
export function toProducerSettings(draft: SettingsDraft): ProducerSettings | null {
  const { instrumentCount, updatesPerBatch, intervalMs } = draft;
  if (instrumentCount === null || updatesPerBatch === null || intervalMs === null) {
    return null;
  }
  return { instrumentCount, updatesPerBatch, intervalMs };
}
