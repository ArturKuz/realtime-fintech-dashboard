import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from './button';
import { type ButtonType, type ButtonVariant } from './button.model';

@Component({
  imports: [Button],
  template: `<app-button
    [variant]="variant()"
    [type]="type()"
    [disabled]="disabled()"
    (click)="clicks = clicks + 1"
    >Pause</app-button
  >`,
})
class Host {
  readonly variant = signal<ButtonVariant>('primary');
  readonly type = signal<ButtonType>('button');
  readonly disabled = signal(false);
  clicks = 0;
}

describe('Button', () => {
  async function render(): Promise<{
    host: Host;
    button: HTMLButtonElement;
    update: () => Promise<void>;
  }> {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    if (button === null) {
      throw new Error('No native button rendered');
    }
    return { host: fixture.componentInstance, button, update: () => fixture.whenStable() };
  }

  it('renders a native button with the projected label, type "button" by default', async () => {
    const { button } = await render();

    expect(button.textContent.trim()).toBe('Pause');
    expect(button.type).toBe('button');
    expect(button.classList).not.toContain('button--secondary');
  });

  it('passes the type through, so it can submit a form', async () => {
    const { host, button, update } = await render();

    host.type.set('submit');
    await update();

    expect(button.type).toBe('submit');
  });

  it('shows the secondary variant', async () => {
    const { host, button, update } = await render();

    host.variant.set('secondary');
    await update();

    expect(button.classList).toContain('button--secondary');
  });

  it('reports clicks to a (click) listener on the component', async () => {
    const { host, button } = await render();

    button.click();

    expect(host.clicks).toBe(1);
  });

  it('blocks clicks while disabled', async () => {
    const { host, button, update } = await render();

    host.disabled.set(true);
    await update();
    button.click();

    expect(button.disabled).toBe(true);
    expect(host.clicks).toBe(0);
  });
});
