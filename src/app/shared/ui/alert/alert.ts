import { Component, input } from '@angular/core';
import { type AlertVariant } from './alert.model';

/**
 * A message banner: optional heading plus projected text. Errors use role="alert", which screen
 * readers announce even when the banner is newly inserted. An info banner has no role: a status
 * region inserted with its text is often not announced, so the page keeps a live region in place
 * and renders the banner inside it.
 */
@Component({
  selector: 'app-alert',
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
  host: {
    '[attr.role]': "variant() === 'error' ? 'alert' : null",
    '[class.alert--error]': "variant() === 'error'",
    '[class.alert--info]': "variant() === 'info'",
  },
})
export class Alert {
  readonly variant = input<AlertVariant>('error');
  // Not named "title": that is a native attribute and would also show a tooltip.
  readonly heading = input<string>();
}
