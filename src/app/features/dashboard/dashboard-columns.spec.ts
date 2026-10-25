import { emptyRows } from '@core/market-data/run-state.utils';
import { WORKED_EXAMPLE_SNAPSHOT_ROW } from '@testing/snapshot-row.fixtures';
import { DASHBOARD_COLUMNS, toDisplayRows } from './dashboard-columns';

describe('DASHBOARD_COLUMNS', () => {
  it('lists the task metrics in order, numbers aligned to the end', () => {
    expect(DASHBOARD_COLUMNS.map(({ header, align }) => [header, align])).toEqual([
      ['Instrument', 'start'],
      ['Last price', 'end'],
      ['Spread', 'end'],
      ['Volume', 'end'],
      ['VWAP', 'end'],
      ['Imbalance', 'end'],
    ]);
  });

  it('has a unique id per column', () => {
    const ids = DASHBOARD_COLUMNS.map((column) => column.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('toDisplayRows', () => {
  it('formats the worked example: spread and VWAP as prices, volume as a count', () => {
    expect(toDisplayRows([WORKED_EXAMPLE_SNAPSHOT_ROW])).toEqual([
      { instrument: 0, cells: ['ALFA', '$102.00', '$0.04', '40', '$101.50', '+0.20'] },
    ]);
  });

  it('shows "—" for unavailable values and 0 volume before any data', () => {
    expect(toDisplayRows(emptyRows(2))).toEqual([
      { instrument: 0, cells: ['ALFA', '—', '—', '0', '—', '—'] },
      { instrument: 1, cells: ['BETA', '—', '—', '0', '—', '—'] },
    ]);
  });

  it('keeps every instrument separate', () => {
    const rows = toDisplayRows([
      WORKED_EXAMPLE_SNAPSHOT_ROW,
      { ...WORKED_EXAMPLE_SNAPSHOT_ROW, instrument: 3, volume: 1_234_567n, imbalance: -0.35 },
    ]);

    expect(rows[0]?.cells[3]).toBe('40');
    expect(rows[1]?.cells).toEqual(['DLTA', '$102.00', '$0.04', '1,234,567', '$101.50', '−0.35']);
  });
});
