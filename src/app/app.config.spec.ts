import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MARKET_WORKER_FACTORY } from '@core/market-data/market-worker.token';
import { FakeMarketWorkerFactory } from '@testing/fake-market-worker';
import { appConfig } from './app.config';

describe('appConfig', () => {
  it('starts run #1 while the app starts, before any page asks for data', async () => {
    const factory = new FakeMarketWorkerFactory();
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        { provide: MARKET_WORKER_FACTORY, useValue: factory.create },
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(factory.workers).toHaveLength(1);
    expect(factory.latest.post).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'start', runId: 1 }),
    );
  });
});
