import { Component, computed, input } from '@angular/core';
import { type SnapshotRow } from '@core/protocol/messages.model';
import { DASHBOARD_COLUMNS, toDisplayRows } from '@features/dashboard/dashboard-columns';

/** The live metrics table, driven by the column list; cells are formatted once per snapshot. */
@Component({
  selector: 'app-market-table',
  templateUrl: './market-table.html',
  styleUrl: './market-table.scss',
})
export class MarketTable {
  readonly rows = input.required<readonly SnapshotRow[]>();

  protected readonly columns = DASHBOARD_COLUMNS;
  protected readonly displayRows = computed(() => toDisplayRows(this.rows(), this.columns));
}
