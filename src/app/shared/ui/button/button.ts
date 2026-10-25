import { Component, input } from '@angular/core';
import { type ButtonType, type ButtonVariant } from './button.model';

/**
 * A native <button> with the app's look. Listen with (click) on <app-button>: clicks bubble from the
 * inner button, and a disabled native button fires none.
 */
@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<ButtonType>('button');
  readonly disabled = input(false);
}
