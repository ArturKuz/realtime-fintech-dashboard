import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

describe('app routes', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    harness = await RouterTestingHarness.create();
  });

  const heading = (): string | undefined =>
    (harness.routeNativeElement?.querySelector('h1')?.textContent ?? undefined)?.trim();

  it('redirects the empty path to the dashboard', async () => {
    await harness.navigateByUrl('/');

    expect(TestBed.inject(Router).url).toBe('/dashboard');
    expect(heading()).toBe('Market dashboard');
  });

  it('renders the settings page on /settings', async () => {
    await harness.navigateByUrl('/settings');

    expect(heading()).toBe('Producer settings');
  });

  it('redirects unknown paths to the dashboard', async () => {
    await harness.navigateByUrl('/does/not/exist');

    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });

  it('sets a page title per route', async () => {
    const title = TestBed.inject(Title);

    await harness.navigateByUrl('/dashboard');
    expect(title.getTitle()).toBe('Dashboard | Realtime Fintech Dashboard');

    await harness.navigateByUrl('/settings');
    expect(title.getTitle()).toBe('Settings | Realtime Fintech Dashboard');
  });
});
