export interface ProducerSettings {
  /** Number of fictional instruments to generate data for. */
  readonly instrumentCount: number;
  /** Total market updates per batch, across all instruments. */
  readonly updatesPerBatch: number;
  /** Requested time between batches, in milliseconds. */
  readonly intervalMs: number;
}

export type SettingKey = keyof ProducerSettings;

export interface SettingLimits {
  readonly min: number;
  readonly max: number;
}

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
