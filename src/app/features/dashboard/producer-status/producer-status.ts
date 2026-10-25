import { Component, computed, input, output } from '@angular/core';
import { type RunStatus } from '@core/market-data/run-state.model';
import { type ProducerSettings } from '@core/market-data/settings.model';
import { RUN_STATUS_BADGE } from '@features/dashboard/dashboard.constants';
import { formatRate } from '@shared/format/format.utils';
import { Button } from '@shared/ui/button/button';
import { StatusBadge } from '@shared/ui/status-badge/status-badge';

/** The producer at a glance: status, run, settings, requested vs actual rate, and Pause/Resume. */
@Component({
  selector: 'app-producer-status',
  imports: [Button, StatusBadge],
  templateUrl: './producer-status.html',
  styleUrl: './producer-status.scss',
})
export class ProducerStatus {
  readonly status = input.required<RunStatus>();
  readonly runId = input.required<number>();
  readonly settings = input.required<ProducerSettings>();
  readonly nominalRate = input.required<number>();
  readonly actualRate = input.required<number | null>();
  readonly pauseRequested = output();
  readonly resumeRequested = output();

  protected readonly badge = computed(() => RUN_STATUS_BADGE[this.status()]);
  protected readonly requestedRate = computed(() => formatRate(this.nominalRate()));
  protected readonly measuredRate = computed(() => {
    const rate = this.actualRate();
    return rate === null ? 'Measuring…' : `~${formatRate(rate)}`;
  });
  protected readonly paused = computed(() => this.status() === 'paused');
  // Pause/Resume only make sense once the run is generating; Apply is the way out of an error.
  protected readonly controlDisabled = computed(
    () => this.status() !== 'running' && this.status() !== 'paused',
  );

  protected toggle(): void {
    if (this.paused()) {
      this.resumeRequested.emit();
    } else {
      this.pauseRequested.emit();
    }
  }
}
