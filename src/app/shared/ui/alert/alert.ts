import { Component, input } from '@angular/core';
import { type AlertVariant } from './alert.model';

/** A message banner: optional heading plus projected text. */
@Component({
  selector: 'app-alert',
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
  host: {
    '[attr.role]': "variant() === 'error' ? 'alert' : 'status'",
    '[class.alert--error]': "variant() === 'error'",
    '[class.alert--info]': "variant() === 'info'",
  },
})
export class Alert {
  readonly variant = input<AlertVariant>('error');
  // Not named "title": that is a native attribute and would also show a tooltip.
  readonly heading = input<string>();
}
