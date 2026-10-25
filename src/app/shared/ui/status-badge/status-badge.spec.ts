import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StatusBadge } from './status-badge';
import { type BadgeTone } from './status-badge.model';

@Component({
  imports: [StatusBadge],
  template: `<app-status-badge [tone]="tone()">{{ label() }}</app-status-badge>`,
})
class Host {
  readonly tone = signal<BadgeTone>('neutral');
  readonly label = signal('Starting');
}

describe('StatusBadge', () => {
  async function render(): Promise<{
    host: Host;
    badge: HTMLElement;
    update: () => Promise<void>;
  }> {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const badge = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      'app-status-badge',
    );
    if (badge === null) {
      throw new Error('No badge rendered');
    }
    return { host: fixture.componentInstance, badge, update: () => fixture.whenStable() };
  }

  it('is a polite live region, so status changes are announced', async () => {
    const { badge } = await render();

    expect(badge.getAttribute('role')).toBe('status');
    expect(badge.getAttribute('aria-live')).toBe('polite');
    expect(badge.getAttribute('aria-atomic')).toBe('true');
  });

  it('shows the status as text, not only as colour', async () => {
    const { host, badge, update } = await render();

    host.label.set('Running');
    await update();

    expect(badge.textContent.trim()).toBe('Running');
  });

  it('marks exactly one tone', async () => {
    const { host, badge, update } = await render();
    expect(badge.classList).toContain('status-badge--neutral');

    host.tone.set('negative');
    await update();

    expect(badge.classList).toContain('status-badge--negative');
    expect(badge.classList).not.toContain('status-badge--neutral');
    expect(badge.classList).not.toContain('status-badge--positive');
  });
});
