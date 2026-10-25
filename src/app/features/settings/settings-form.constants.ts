import { type SettingsFieldView } from './settings-form.model';

/** The form, field by field. The allowed range is added from the validation rules. */
export const SETTINGS_FIELDS: readonly SettingsFieldView[] = [
  {
    key: 'instrumentCount',
    label: 'Instruments',
    hint: 'How many fictional instruments to simulate.',
  },
  {
    key: 'updatesPerBatch',
    label: 'Updates per batch',
    hint: 'Market updates generated in each batch, across all instruments.',
  },
  {
    key: 'intervalMs',
    label: 'Interval (ms)',
    hint: 'Requested time between batches.',
  },
];
