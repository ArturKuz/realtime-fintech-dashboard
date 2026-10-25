import { type SnapshotRow } from '@core/protocol/messages.model';
import { type BadgeTone } from '@shared/ui/status-badge/status-badge.model';

/** One table column: its header, alignment and how to turn a row into the cell text. */
export interface DashboardColumn {
  readonly id: string;
  readonly header: string;
  /** Text columns start-aligned, number columns end-aligned. */
  readonly align: 'start' | 'end';
  readonly format: (row: SnapshotRow) => string;
}

/** A row ready for display: one string per column, in column order. */
export interface DisplayRow {
  readonly instrument: number;
  readonly cells: readonly string[];
}

export interface StatusBadgeView {
  readonly label: string;
  readonly tone: BadgeTone;
}
