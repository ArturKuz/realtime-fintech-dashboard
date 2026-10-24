import { DEFAULT_SETTINGS, SETTINGS_LIMITS } from './settings.constants';
import { type ProducerSettings, type SettingKey } from './settings.model';

/** Requested updates per second across all instruments. */
export function nominalRate(settings: ProducerSettings): number {
  return (settings.updatesPerBatch * 1000) / settings.intervalMs;
}

/**
 * Defensive guard for the worker: forces every setting into an integer within its limits.
 * The form already rejects invalid input; this protects the producer from any other caller.
 */
export function clampSettings(settings: ProducerSettings): ProducerSettings {
  return {
    instrumentCount: clampSetting('instrumentCount', settings.instrumentCount),
    updatesPerBatch: clampSetting('updatesPerBatch', settings.updatesPerBatch),
    intervalMs: clampSetting('intervalMs', settings.intervalMs),
  };
}

function clampSetting(key: SettingKey, value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SETTINGS[key];
  }
  const { min, max } = SETTINGS_LIMITS[key];
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
