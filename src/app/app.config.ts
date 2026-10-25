import {
  type ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { MarketDataService } from '@core/market-data/market-data.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // The producer starts with the app (task: generate immediately with the defaults), not with a page.
    provideAppInitializer(() => {
      inject(MarketDataService);
    }),
  ],
};
