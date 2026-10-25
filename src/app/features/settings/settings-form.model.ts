import { type SettingKey } from '@core/market-data/settings.model';

/** What the form edits: like ProducerSettings, but a field may be empty while the user types. */
export type SettingsDraft = Record<SettingKey, number | null>;

export interface SettingsFieldView {
  readonly key: SettingKey;
  readonly label: string;
  readonly hint: string;
}
