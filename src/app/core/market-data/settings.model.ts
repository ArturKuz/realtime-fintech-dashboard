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
