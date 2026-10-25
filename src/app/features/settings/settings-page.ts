import { Component, inject, linkedSignal, signal } from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { MarketDataService } from '@core/market-data/market-data.service';
import { Alert } from '@shared/ui/alert/alert';
import { Button } from '@shared/ui/button/button';
import { NumberField } from '@shared/ui/number-field/number-field';
import { settingsSchema } from './settings-form';
import { SETTINGS_FIELDS } from './settings-form.constants';
import { type SettingsDraft } from './settings-form.model';
import { toProducerSettings } from './settings-form.utils';

/**
 * Edits a draft of the producer settings. Editing never touches the producer; only Apply does,
 * which starts a new run. The draft follows the applied settings, so it resets after Apply.
 */
@Component({
  selector: 'app-settings-page',
  imports: [Alert, Button, FormField, FormRoot, NumberField, RouterLink],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  private readonly market = inject(MarketDataService);

  protected readonly fields = SETTINGS_FIELDS;
  private readonly draft = linkedSignal<SettingsDraft>(() => ({
    ...this.market.appliedSettings(),
  }));
  protected readonly settingsForm = form(this.draft, settingsSchema, {
    // Runs only when the form is valid; <form [formRoot]> calls it on submit.
    submission: {
      action: (field) => {
        this.apply(field().value());
        return Promise.resolve(undefined);
      },
    },
  });
  /** The run started by the last Apply on this page, for the confirmation message. */
  protected readonly startedRun = signal<number | null>(null);

  private apply(draft: SettingsDraft): void {
    const settings = toProducerSettings(draft);
    if (settings === null) {
      return; // not reachable: the action runs only for a valid form, where nothing is empty
    }
    this.market.apply(settings);
    this.startedRun.set(this.market.runId());
  }
}
