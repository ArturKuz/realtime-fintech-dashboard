import { TestBed } from '@angular/core/testing';
import { SettingsPage } from './settings-page';

describe('SettingsPage', () => {
  it('renders the page heading', async () => {
    const fixture = TestBed.createComponent(SettingsPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('h1')?.textContent.trim()).toBe('Producer settings');
  });
});
