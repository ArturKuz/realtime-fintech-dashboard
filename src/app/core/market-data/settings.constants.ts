import { type ProducerSettings, type SettingKey, type SettingLimits } from './settings.model';

/** The single source of truth for allowed values: used by form validation and by the worker. */
export const SETTINGS_LIMITS: Readonly<Record<SettingKey, SettingLimits>> = {
  instrumentCount: { min: 1, max: 50 },
  updatesPerBatch: { min: 1, max: 1000 },
  intervalMs: { min: 50, max: 2000 },
};

export const DEFAULT_SETTINGS: ProducerSettings = {
  instrumentCount: 5,
  updatesPerBatch: 100,
  intervalMs: 500,
};
