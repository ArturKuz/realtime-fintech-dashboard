import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  async function renderAt(url: string): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const navLink = (root: HTMLElement, text: string): HTMLAnchorElement | undefined =>
    Array.from(root.querySelectorAll<HTMLAnchorElement>('nav a')).find(
      (a) => a.textContent.trim() === text,
    );

  it('shows the application name in the header, not as the page heading', async () => {
    const root = await renderAt('/dashboard');

    expect(root.querySelector('header')?.textContent).toContain('Realtime Fintech Dashboard');
    expect(root.querySelector('header h1')).toBeNull();
  });

  it('links to both pages from the main navigation', async () => {
    const root = await renderAt('/dashboard');

    expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Main');
    expect(navLink(root, 'Dashboard')?.getAttribute('href')).toBe('/dashboard');
    expect(navLink(root, 'Settings')?.getAttribute('href')).toBe('/settings');
  });

  it('marks only the active link with aria-current="page"', async () => {
    const root = await renderAt('/settings');

    expect(navLink(root, 'Settings')?.getAttribute('aria-current')).toBe('page');
    expect(navLink(root, 'Dashboard')?.hasAttribute('aria-current')).toBe(false);
  });

  it('renders the routed page inside the main landmark', async () => {
    const root = await renderAt('/settings');

    expect(root.querySelector('main h1')?.textContent.trim()).toBe('Producer settings');
  });

  it('offers a skip link to the main content as the first focusable element', async () => {
    const root = await renderAt('/dashboard');
    const first = root.querySelector('a');
    const main = root.querySelector('main');

    expect(first?.textContent.trim()).toBe('Skip to main content');
    expect(first?.getAttribute('href')).toBe('#main-content');
    expect(main?.id).toBe('main-content');
    expect(main?.getAttribute('tabindex')).toBe('-1');
  });

  it('moves focus to the main content without navigating when the skip link is used', async () => {
    const root = await renderAt('/settings');
    const skipLink = root.querySelector<HTMLAnchorElement>('a');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    skipLink?.dispatchEvent(click);

    // A plain "#main-content" link resolves against <base href> and would reload the root page.
    expect(click.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(root.querySelector('main'));
    expect(TestBed.inject(Router).url).toBe('/settings');
  });
});
