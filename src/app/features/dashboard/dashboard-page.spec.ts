import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MarketDataService } from '@core/market-data/market-data.service';
import { MarketDataServiceStub } from '@testing/market-data-service.stub';
import { WORKED_EXAMPLE_SNAPSHOT_ROW } from '@testing/snapshot-row.fixtures';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  let service: MarketDataServiceStub;

  async function render() {
    service = new MarketDataServiceStub();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: MarketDataService, useValue: service }],
    });
    const fixture = TestBed.createComponent(DashboardPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return { root, update: () => fixture.whenStable() };
  }

  const firstRowCells = (root: HTMLElement): string[] =>
    Array.from(root.querySelectorAll('tbody tr:first-child > *'), (cell) =>
      cell.textContent.trim(),
    );
  const control = (root: HTMLElement): HTMLButtonElement | null =>
    root.querySelector('app-producer-status button');

  it('renders the page heading', async () => {
    const { root } = await render();

    expect(root.querySelector('h1')?.textContent.trim()).toBe('Market dashboard');
  });

  it('shows "—" and 0 for every instrument before any data', async () => {
    const { root } = await render();

    expect(root.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(firstRowCells(root)).toEqual(['ALFA', '—', '—', '0', '—', '—']);
  });

  it('shows the latest snapshot from the service', async () => {
    const { root, update } = await render();

    service.rows.set([WORKED_EXAMPLE_SNAPSHOT_ROW]);
    await update();

    expect(firstRowCells(root)).toEqual(['ALFA', '$102.00', '$0.04', '40', '$101.50', '+0.20']);
  });

  it('shows the producer status from the service', async () => {
    const { root, update } = await render();

    service.status.set('running');
    service.actualRate.set(199.6);
    await update();

    expect(root.querySelector('app-status-badge')?.textContent.trim()).toBe('Running');
    expect(root.querySelector('app-producer-status')?.textContent).toContain('~200 updates/s');
  });

  it('pauses and resumes the producer', async () => {
    const { root, update } = await render();
    service.status.set('running');
    await update();

    control(root)?.click();
    expect(service.pause).toHaveBeenCalledOnce();

    service.status.set('paused');
    await update();
    control(root)?.click();
    expect(service.resume).toHaveBeenCalledOnce();
  });

  it('explains an error in plain words and points to the settings', async () => {
    const { root, update } = await render();
    expect(root.querySelector('app-alert')).toBeNull();

    service.status.set('error');
    service.errorMessage.set('The market data generator could not be downloaded.');
    await update();

    const alert = root.querySelector('app-alert');
    expect(alert?.getAttribute('role')).toBe('alert');
    expect(alert?.textContent).toContain('The market data generator could not be downloaded.');
    expect(alert?.querySelector('a')?.getAttribute('href')).toBe('/settings');
  });
});
