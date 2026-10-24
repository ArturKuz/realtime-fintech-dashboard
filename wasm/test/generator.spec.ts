import { describe, expect, it } from 'vitest';
import { SETTINGS_LIMITS } from '@core/market-data/settings.constants';
import { UPDATE_FIELD, UPDATE_STRIDE } from '@core/protocol/market-update-layout.constants';
import { type MarketUpdate } from '@core/protocol/market-update.model';
import { type MarketGenerator } from '@worker/generator.model';
import { compileGeneratorModule, loadGenerator } from './generator.helpers';

const SEED = 42;

// Bounds the generator promises (see wasm/assembly/index.ts).
const PRICE_FLOOR_CENTS = 100;
const PRICE_CEILING_CENTS = 100_000;
const MAX_TRADE_QTY = 100;
const MAX_BOOK_QTY = 1000;

/** Decodes the flat buffer into named updates (copies, so later batches cannot change them). */
function decode(buffer: Int32Array): MarketUpdate[] {
  const updates: MarketUpdate[] = [];
  for (let offset = 0; offset < buffer.length; offset += UPDATE_STRIDE) {
    const at = (field: number): number => buffer[offset + field] ?? Number.NaN;
    updates.push({
      instrument: at(UPDATE_FIELD.instrument),
      priceCents: at(UPDATE_FIELD.priceCents),
      tradeQty: at(UPDATE_FIELD.tradeQty),
      bidCents: at(UPDATE_FIELD.bidCents),
      askCents: at(UPDATE_FIELD.askCents),
      bidQty: at(UPDATE_FIELD.bidQty),
      askQty: at(UPDATE_FIELD.askQty),
    });
  }
  return updates;
}

/** Runs `batches` batches of `size` updates and returns every update in order. */
function run(generator: MarketGenerator, batches: number, size: number): MarketUpdate[] {
  const all: MarketUpdate[] = [];
  for (let i = 0; i < batches; i++) {
    all.push(...decode(generator.generate(size)));
  }
  return all;
}

function started(instrumentCount: number, seed = SEED): MarketGenerator {
  const generator = loadGenerator();
  generator.init(instrumentCount, seed);
  return generator;
}

describe('compiled generator module', () => {
  it('imports nothing: randomness and prices are computed inside Wasm', () => {
    expect(WebAssembly.Module.imports(compileGeneratorModule())).toEqual([]);
  });

  it('exports limits that match the app settings and update layout', () => {
    const generator = loadGenerator();

    expect(generator.maxInstruments).toBe(SETTINGS_LIMITS.instrumentCount.max);
    expect(generator.maxBatch).toBe(SETTINGS_LIMITS.updatesPerBatch.max);
    expect(generator.updateStride).toBe(UPDATE_STRIDE);
  });
});

describe('batch size', () => {
  it.each([1, 100, 1000])('returns exactly %i updates when asked for %i', (size) => {
    expect(started(5).generate(size)).toHaveLength(size * UPDATE_STRIDE);
  });
});

describe('generated values (100 batches of 1,000 updates, 50 instruments)', () => {
  const updates = run(started(50), 100, 1000);

  it('picks valid instrument indices', () => {
    for (const u of updates) {
      expect(u.instrument).toBeGreaterThanOrEqual(0);
      expect(u.instrument).toBeLessThan(50);
    }
  });

  it('keeps every price positive and within the floor and ceiling', () => {
    for (const u of updates) {
      expect(u.bidCents).toBeGreaterThanOrEqual(PRICE_FLOOR_CENTS);
      expect(u.askCents).toBeLessThanOrEqual(PRICE_CEILING_CENTS);
      expect(u.priceCents).toBeGreaterThan(0);
    }
  });

  it('keeps the bid below the ask (at least one cent of spread)', () => {
    for (const u of updates) {
      expect(u.askCents - u.bidCents).toBeGreaterThanOrEqual(1);
    }
  });

  it('trades at either the bid or the ask, and both happen', () => {
    for (const u of updates) {
      expect([u.bidCents, u.askCents]).toContain(u.priceCents);
    }
    expect(updates.some((u) => u.priceCents === u.bidCents)).toBe(true);
    expect(updates.some((u) => u.priceCents === u.askCents)).toBe(true);
  });

  it('uses positive trade quantities and non-negative book quantities', () => {
    for (const u of updates) {
      expect(u.tradeQty).toBeGreaterThanOrEqual(1);
      expect(u.tradeQty).toBeLessThanOrEqual(MAX_TRADE_QTY);
      expect(u.bidQty).toBeGreaterThanOrEqual(0);
      expect(u.askQty).toBeGreaterThanOrEqual(0);
      expect(u.bidQty).toBeLessThanOrEqual(MAX_BOOK_QTY);
      expect(u.askQty).toBeLessThanOrEqual(MAX_BOOK_QTY);
    }
  });

  it('sometimes leaves a side of the book empty, so the app meets zero denominators', () => {
    expect(updates.some((u) => u.bidQty === 0 || u.askQty === 0)).toBe(true);
  });

  it('keeps price × quantity of one trade at most 10^7, so a batch sum stays exact', () => {
    for (const u of updates) {
      expect(u.priceCents * u.tradeQty).toBeLessThanOrEqual(10_000_000);
    }
  });
});

describe('price evolution', () => {
  it('moves each price from its previous value instead of drawing a new one', () => {
    const updates = run(started(5), 20, 1000);
    const previous = new Map<number, number>();

    for (const u of updates) {
      const last = previous.get(u.instrument);
      if (last !== undefined) {
        // A random walk step is at most 0.2 % of the price, plus up to half a spread on each side.
        expect(Math.abs(u.priceCents - last)).toBeLessThanOrEqual(last * 0.005 + 100);
      }
      previous.set(u.instrument, u.priceCents);
    }
  });

  it('keeps per-instrument state between generate calls', () => {
    const generator = started(1);
    const lastOfFirst = decode(generator.generate(1000)).at(-1)?.priceCents ?? 0;
    const firstOfSecond = decode(generator.generate(1)).at(0)?.priceCents ?? 0;

    expect(Math.abs(firstOfSecond - lastOfFirst)).toBeLessThanOrEqual(lastOfFirst * 0.005 + 100);
  });

  it('actually moves: prices change over a run', () => {
    const prices = new Set(run(started(1), 1, 1000).map((u) => u.priceCents));

    expect(prices.size).toBeGreaterThan(10);
  });
});

describe('instrument selection', () => {
  it('uses only instrument 0 when there is one instrument', () => {
    expect(run(started(1), 1, 50).every((u) => u.instrument === 0)).toBe(true);
  });

  it('spreads updates across all instruments, with repeats in one batch', () => {
    const indices = run(started(5), 1, 1000).map((u) => u.instrument);

    expect(new Set(indices)).toEqual(new Set([0, 1, 2, 3, 4]));
  });
});

describe('determinism', () => {
  it('produces identical output for the same seed', () => {
    expect(run(started(5, SEED), 3, 500)).toEqual(run(started(5, SEED), 3, 500));
  });

  it('produces different output for a different seed', () => {
    expect(run(started(5, SEED), 1, 100)).not.toEqual(run(started(5, SEED + 1), 1, 100));
  });

  it('works with seed 0 (xorshift would otherwise get stuck at zero)', () => {
    const prices = new Set(run(started(1, 0), 1, 200).map((u) => u.priceCents));

    expect(prices.size).toBeGreaterThan(1);
  });

  it('starts over on init: same seed after generating gives the first batch again', () => {
    const fresh = run(started(5), 1, 100);
    const reused = started(5);
    reused.generate(1000);
    reused.init(5, SEED);

    expect(run(reused, 1, 100)).toEqual(fresh);
  });
});
