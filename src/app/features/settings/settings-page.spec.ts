import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MarketDataService } from '@core/market-data/market-data.service';
import { type ProducerSettings } from '@core/market-data/settings.model';
import { MarketDataServiceStub } from '@testing/market-data-service.stub';
import { SettingsPage } from './settings-page';

describe('SettingsPage', () => {
  let service: MarketDataServiceStub;

  async function render() {
    service = new MarketDataServiceStub();
    // Like the real service: Apply starts the next run with the applied settings.
    service.apply.mockImplementation((settings: ProducerSettings) => {
      service.appliedSettings.set({ ...settings });
      service.runId.update((id) => id + 1);
    });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: MarketDataService, useValue: service }],
    });
    const fixture = TestBed.createComponent(SettingsPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const inputs = Array.from(root.querySelectorAll('input'));
    const applyButton = root.querySelector<HTMLButtonElement>('button[type="submit"]');
    return { root, inputs, applyButton, update: () => fixture.whenStable() };
  }

  function type(input: HTMLInputElement | undefined, text: string): void {
    if (input === undefined) {
      throw new Error('Missing input');
    }
    input.value = text;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  it('renders the page heading', async () => {
    const { root } = await render();

    expect(root.querySelector('h1')?.textContent.trim()).toBe('Producer settings');
  });

  it('starts from the applied settings, one labelled field each, ranges from the limits', async () => {
    const { root, inputs } = await render();

    expect(inputs.map((input) => input.value)).toEqual(['5', '100', '500']);
    expect(Array.from(root.querySelectorAll('label'), (l) => l.textContent.trim())).toEqual([
      'Instruments',
      'Updates per batch',
      'Interval (ms)',
    ]);
    const hints = Array.from(root.querySelectorAll('.number-field__hint'), (p) => p.textContent);
    expect(hints[0]).toContain('From 1 to 50.');
    expect(hints[1]).toContain('From 1 to 1000.');
    expect(hints[2]).toContain('From 50 to 2000.');
  });

  it('never touches the producer while editing', async () => {
    const { inputs, update } = await render();

    type(inputs[0], '12');
    type(inputs[1], '0');
    type(inputs[2], '');
    await update();

    expect(service.apply).not.toHaveBeenCalled();
    expect(service.appliedSettings()).toEqual({
      instrumentCount: 5,
      updatesPerBatch: 100,
      intervalMs: 500,
    });
  });

  it.each(['0', '51', '1.5', '', 'abc'])(
    'shows an error and blocks Apply for instruments %j',
    async (text) => {
      const { root, inputs, applyButton, update } = await render();

      type(inputs[0], text);
      await update();

      expect(applyButton?.disabled).toBe(true);
      expect(root.querySelector('.number-field__errors')?.textContent.trim()).not.toBe('');
    },
  );

  it('accepts exponent notation that is a whole number (1e2 = 100)', async () => {
    const { inputs, applyButton, update } = await render();

    type(inputs[1], '1e2');
    await update();

    expect(applyButton?.disabled).toBe(false);
  });

  it('applies the edited settings once and confirms the new run', async () => {
    const { root, inputs, applyButton, update } = await render();

    type(inputs[0], '3');
    type(inputs[1], '1000');
    type(inputs[2], '50');
    await update();
    applyButton?.click();
    await update();

    expect(service.apply).toHaveBeenCalledExactlyOnceWith({
      instrumentCount: 3,
      updatesPerBatch: 1000,
      intervalMs: 50,
    });
    const confirmation = root.querySelector('[role="status"] app-alert');
    expect(confirmation?.textContent).toContain('Run #2 started');
    expect(confirmation?.querySelector('a')?.getAttribute('href')).toBe('/dashboard');
  });

  it('keeps an empty live region in place before Apply, so the confirmation is announced', async () => {
    const { root } = await render();
    const region = root.querySelector('[role="status"]');

    expect(region).not.toBeNull();
    expect(region?.textContent.trim()).toBe('');
  });

  it('shows the newly applied settings after Apply', async () => {
    const { inputs, applyButton, update } = await render();
    type(inputs[0], '7');
    await update();

    applyButton?.click();
    await update();

    expect(inputs.map((input) => input.value)).toEqual(['7', '100', '500']);
  });

  it('follows the applied settings, e.g. when the producer adjusted them', async () => {
    const { inputs, update } = await render();
    type(inputs[0], '9');

    service.appliedSettings.set({ instrumentCount: 50, updatesPerBatch: 1000, intervalMs: 50 });
    await update();

    expect(inputs.map((input) => input.value)).toEqual(['50', '1000', '50']);
  });

  it('can apply unchanged settings to restart with fresh totals', async () => {
    const { applyButton, update } = await render();

    applyButton?.click();
    await update();

    expect(service.apply).toHaveBeenCalledExactlyOnceWith({
      instrumentCount: 5,
      updatesPerBatch: 100,
      intervalMs: 500,
    });
  });
});
