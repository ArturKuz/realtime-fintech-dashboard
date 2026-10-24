import { Component, type ElementRef, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NAV_LINKS } from './app.constants';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly links = NAV_LINKS;

  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  // With <base href>, "#main-content" would resolve to the site root, so focus the landmark directly.
  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
