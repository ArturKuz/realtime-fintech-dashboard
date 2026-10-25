import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarketDataService } from '@core/market-data/market-data.service';
import { Alert } from '@shared/ui/alert/alert';
import { MarketTable } from './market-table/market-table';
import { ProducerStatus } from './producer-status/producer-status';

/** Container: reads the producer state from the service and hands it to presentational parts. */
@Component({
  selector: 'app-dashboard-page',
  imports: [Alert, MarketTable, ProducerStatus, RouterLink],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  protected readonly market = inject(MarketDataService);
}
