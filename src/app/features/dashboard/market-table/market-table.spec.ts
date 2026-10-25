import { TestBed } from '@angular/core/testing';
import { emptyRows } from '@core/market-data/run-state.utils';
import { type SnapshotRow } from '@core/protocol/messages.model';
import { WORKED_EXAMPLE_SNAPSHOT_ROW } from '@testing/snapshot-row.fixtures';
import { MarketTable } from './market-table';

describe('MarketTable', () => {
  async function render(rows: readonly SnapshotRow[]) {
    const fixture = TestBed.createComponent(MarketTable);
    fixture.componentRef.setInput('rows', rows);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const update = async (next: readonly SnapshotRow[]): Promise<void> => {
      fixture.componentRef.setInput('rows', next);
      await fixture.whenStable();
    };
    return { root, update };
  }

  const bodyRows = (root: HTMLElement): HTMLTableRowElement[] =>
    Array.from(root.querySelectorAll('tbody tr'));
  const cellTexts = (row: HTMLTableRowElement | undefined): string[] =>
    Array.from(row?.cells ?? [], (cell) => cell.textContent.trim());

  it('is a captioned table with column headers', async () => {
    const { root } = await render(emptyRows(1));

    expect(root.querySelector('table caption')?.textContent.trim()).toBe(
      'Live metrics per instrument',
    );
    const headers = Array.from(root.querySelectorAll('thead th'));
    expect(headers.map((th) => th.textContent.trim())).toEqual([
      'Instrument',
      'Last price',
      'Spread',
      'Volume',
      'VWAP',
      'Imbalance',
    ]);
    expect(headers.every((th) => th.getAttribute('scope') === 'col')).toBe(true);
  });

  it('shows "—" and 0 before any data, one row per instrument', async () => {
    const { root } = await render(emptyRows(5));

    expect(bodyRows(root)).toHaveLength(5);
    expect(cellTexts(bodyRows(root)[0])).toEqual(['ALFA', '—', '—', '0', '—', '—']);
  });

  it('shows formatted metrics, with the symbol as the row header', async () => {
    const { root } = await render([WORKED_EXAMPLE_SNAPSHOT_ROW]);
    const row = bodyRows(root)[0];

    expect(cellTexts(row)).toEqual(['ALFA', '$102.00', '$0.04', '40', '$101.50', '+0.20']);
    expect(row?.cells[0]?.tagName).toBe('TH');
    expect(row?.cells[0]?.getAttribute('scope')).toBe('row');
  });

  it('right-aligns number columns with tabular figures', async () => {
    const { root } = await render([WORKED_EXAMPLE_SNAPSHOT_ROW]);
    const cells = bodyRows(root)[0]?.cells;

    expect(cells?.[0]?.classList).not.toContain('market-table__cell--end');
    expect(cells?.[1]?.classList).toContain('market-table__cell--end');
    expect(root.querySelector('table')?.classList).toContain('t-numeric');
  });

  it('updates rows in place: the same DOM row is reused for an instrument', async () => {
    const { root, update } = await render(emptyRows(2));
    const firstRow = bodyRows(root)[0];

    await update([WORKED_EXAMPLE_SNAPSHOT_ROW, ...emptyRows(2).slice(1)]);

    expect(bodyRows(root)[0]).toBe(firstRow);
    expect(cellTexts(bodyRows(root)[0])[1]).toBe('$102.00');
  });

  it('can be scrolled with the keyboard on narrow screens', async () => {
    const { root } = await render(emptyRows(1));
    const region = root.querySelector('.market-table__scroll');

    expect(region?.getAttribute('role')).toBe('region');
    expect(region?.getAttribute('tabindex')).toBe('0');
    const labelId = region?.getAttribute('aria-labelledby') ?? '';
    expect(root.querySelector(`#${labelId}`)?.textContent.trim()).toBe(
      'Live metrics per instrument',
    );
  });
});
