import { Component, type ElementRef, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavLink {
  readonly path: string;
  readonly label: string;
}

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly links: readonly NavLink[] = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/settings', label: 'Settings' },
  ];

  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  // With <base href>, "#main-content" would resolve to the site root, so focus the landmark directly.
  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
