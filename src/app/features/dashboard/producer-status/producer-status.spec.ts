import { TestBed } from '@angular/core/testing';
import { type RunStatus } from '@core/market-data/run-state.model';
import { ProducerStatus } from './producer-status';

describe('ProducerStatus', () => {
  async function render(inputs: { status?: RunStatus; actualRate?: number | null } = {}) {
    const fixture = TestBed.createComponent(ProducerStatus);
    const ref = fixture.componentRef;
    ref.setInput('status', inputs.status ?? 'running');
    ref.setInput('runId', 3);
    ref.setInput('settings', { instrumentCount: 5, updatesPerBatch: 100, intervalMs: 500 });
    ref.setInput('nominalRate', 200);
    ref.setInput('actualRate', inputs.actualRate === undefined ? 198.4 : inputs.actualRate);
    const pauses: number[] = [];
    const resumes: number[] = [];
    fixture.componentInstance.pauseRequested.subscribe(() => pauses.push(1));
    fixture.componentInstance.resumeRequested.subscribe(() => resumes.push(1));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const button = root.querySelector<HTMLButtonElement>('app-button button');
    return { root, button, pauses, resumes };
  }

  const details = (root: HTMLElement): Record<string, string> =>
    Object.fromEntries(
      Array.from(root.querySelectorAll('dt'), (dt) => [
        dt.textContent.trim(),
        dt.nextElementSibling?.textContent.trim() ?? '',
      ]),
    );

  it('shows the status in words in a live badge', async () => {
    const { root } = await render({ status: 'paused' });
    const badge = root.querySelector('app-status-badge');

    expect(badge?.textContent.trim()).toBe('Paused');
    expect(badge?.getAttribute('role')).toBe('status');
  });

  it('shows the run, the applied settings and both rates', async () => {
    const { root } = await render();

    expect(details(root)).toEqual({
      Run: '#3',
      Instruments: '5',
      'Updates per batch': '100',
      Interval: '500 ms',
      Requested: '200 updates/s',
      Actual: '~198 updates/s',
    });
  });

  it('says the actual rate is still being measured', async () => {
    const { root } = await render({ actualRate: null });

    expect(details(root)['Actual']).toBe('Measuring…');
  });

  it('offers Pause while running', async () => {
    const { button, pauses, resumes } = await render({ status: 'running' });

    expect(button?.textContent.trim()).toBe('Pause');
    button?.click();

    expect(pauses).toHaveLength(1);
    expect(resumes).toHaveLength(0);
  });

  it('offers Resume while paused', async () => {
    const { button, pauses, resumes } = await render({ status: 'paused' });

    expect(button?.textContent.trim()).toBe('Resume');
    button?.click();

    expect(resumes).toHaveLength(1);
    expect(pauses).toHaveLength(0);
  });

  it.each<RunStatus>(['starting', 'error'])('disables the control while %s', async (status) => {
    const { button, pauses, resumes } = await render({ status });

    expect(button?.disabled).toBe(true);
    button?.click();

    expect(pauses).toHaveLength(0);
    expect(resumes).toHaveLength(0);
  });
});
