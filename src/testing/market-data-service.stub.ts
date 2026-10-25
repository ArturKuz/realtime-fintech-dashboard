import { signal } from '@angular/core';
import { type MarketDataService } from '@core/market-data/market-data.service';
import { type RunStatus } from '@core/market-data/run-state.model';
import { emptyRows } from '@core/market-data/run-state.utils';
import { DEFAULT_SETTINGS } from '@core/market-data/settings.constants';
import { type ProducerSettings } from '@core/market-data/settings.model';
import { type SnapshotRow } from '@core/protocol/messages.model';

type PublicApi = Pick<
  MarketDataService,
  | 'appliedSettings'
  | 'runId'
  | 'status'
  | 'rows'
  | 'actualRate'
  | 'errorMessage'
  | 'nominalRate'
  | 'apply'
  | 'pause'
  | 'resume'
>;

/**
 * Stands in for MarketDataService in page tests: every signal is writable, so a test sets the
 * state it needs directly; methods are spies. Provide with { provide: MarketDataService, useValue }.
 */
export class MarketDataServiceStub implements PublicApi {
  readonly appliedSettings = signal<ProducerSettings>(DEFAULT_SETTINGS);
  readonly runId = signal(1);
  readonly status = signal<RunStatus>('starting');
  readonly rows = signal<readonly SnapshotRow[]>(emptyRows(DEFAULT_SETTINGS.instrumentCount));
  readonly actualRate = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly nominalRate = signal(200);

  readonly apply = vi.fn<(settings: ProducerSettings) => void>();
  readonly pause = vi.fn<() => void>();
  readonly resume = vi.fn<() => void>();
}
