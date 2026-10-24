import { TestBed } from '@angular/core/testing';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  it('renders the page heading', async () => {
    const fixture = TestBed.createComponent(DashboardPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('h1')?.textContent.trim()).toBe('Market dashboard');
  });
});
