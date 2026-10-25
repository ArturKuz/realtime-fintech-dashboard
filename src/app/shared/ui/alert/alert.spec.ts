import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Alert } from './alert';
import { type AlertVariant } from './alert.model';

@Component({
  imports: [Alert],
  template: `<app-alert [variant]="variant()" [heading]="heading()"
    >Apply the settings again.</app-alert
  >`,
})
class Host {
  readonly variant = signal<AlertVariant>('error');
  readonly heading = signal<string | undefined>('Producer stopped');
}

describe('Alert', () => {
  async function render(): Promise<{
    host: Host;
    alert: HTMLElement;
    update: () => Promise<void>;
  }> {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const alert = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('app-alert');
    if (alert === null) {
      throw new Error('No alert rendered');
    }
    return { host: fixture.componentInstance, alert, update: () => fixture.whenStable() };
  }

  it('interrupts with role="alert" for errors and shows heading and message', async () => {
    const { alert } = await render();

    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.classList).toContain('alert--error');
    expect(alert.querySelector('.alert__heading')?.textContent.trim()).toBe('Producer stopped');
    expect(alert.querySelector('.alert__body')?.textContent.trim()).toBe(
      'Apply the settings again.',
    );
  });

  it('announces information politely with role="status"', async () => {
    const { host, alert, update } = await render();

    host.variant.set('info');
    await update();

    expect(alert.getAttribute('role')).toBe('status');
    expect(alert.classList).toContain('alert--info');
    expect(alert.classList).not.toContain('alert--error');
  });

  it('works without a heading', async () => {
    const { host, alert, update } = await render();

    host.heading.set(undefined);
    await update();

    expect(alert.querySelector('.alert__heading')).toBeNull();
  });
});
