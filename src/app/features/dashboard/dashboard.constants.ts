import { type RunStatus } from '@core/market-data/run-state.model';
import { type StatusBadgeView } from './dashboard.model';

/** How each producer status reads in the badge. Paused is neutral: nothing is wrong. */
export const RUN_STATUS_BADGE: Readonly<Record<RunStatus, StatusBadgeView>> = {
  starting: { label: 'Starting', tone: 'neutral' },
  running: { label: 'Running', tone: 'positive' },
  paused: { label: 'Paused', tone: 'neutral' },
  error: { label: 'Error', tone: 'negative' },
};
