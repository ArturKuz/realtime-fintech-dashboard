import { Component, input } from '@angular/core';
import { type BadgeTone } from './status-badge.model';

/** A status as text plus a coloured marker. A polite live region: screen readers hear changes. */
@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  host: {
    class: 'status-badge',
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
    '[class.status-badge--neutral]': "tone() === 'neutral'",
    '[class.status-badge--positive]': "tone() === 'positive'",
    '[class.status-badge--negative]': "tone() === 'negative'",
  },
})
export class StatusBadge {
  readonly tone = input<BadgeTone>('neutral');
}
