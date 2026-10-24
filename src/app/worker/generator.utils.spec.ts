import { UPDATE_STRIDE } from '@core/protocol/market-update-layout.constants';
import { type GeneratorExports } from './generator.model';
import { createMarketGenerator } from './generator.utils';

const i32 = (value: number): WebAssembly.Global =>
  new WebAssembly.Global({ value: 'i32', mutable: false }, value);

const OUTPUT_POINTER = 64;

/** Exports shaped like the real module; `generate` fills the output buffer with 0, 1, 2, … */
function fakeExports(overrides: Partial<GeneratorExports> = {}): GeneratorExports {
  const memory = new WebAssembly.Memory({ initial: 1 });
  return {
    memory,
    init: vi.fn(),
    generate: vi.fn((count: number) => {
      const view = new Int32Array(memory.buffer, OUTPUT_POINTER, count * UPDATE_STRIDE);
      view.forEach((_, i) => (view[i] = i));
      return OUTPUT_POINTER;
    }),
    MAX_INSTRUMENTS: i32(50),
    MAX_BATCH: i32(1000),
    UPDATE_STRIDE: i32(UPDATE_STRIDE),
    ...overrides,
  };
}

describe('createMarketGenerator', () => {
  it('reads the limits the module exports', () => {
    const generator = createMarketGenerator(fakeExports());

    expect(generator.maxInstruments).toBe(50);
    expect(generator.maxBatch).toBe(1000);
  });

  it('returns a view of exactly n updates at the pointer the module returns', () => {
    const exports = fakeExports();

    const updates = createMarketGenerator(exports).generate(3);

    expect(exports.generate).toHaveBeenCalledWith(3);
    expect(updates).toHaveLength(3 * UPDATE_STRIDE);
    expect(updates.byteOffset).toBe(OUTPUT_POINTER);
    expect(Array.from(updates.slice(0, 3))).toEqual([0, 1, 2]);
  });

  it('creates a fresh view per call, so it stays valid after Wasm memory grows', () => {
    const exports = fakeExports();
    const generator = createMarketGenerator(exports);

    const before = generator.generate(1);
    exports.memory.grow(1); // detaches the old ArrayBuffer
    const after = generator.generate(1);

    expect(before).toHaveLength(0);
    expect(after).toHaveLength(UPDATE_STRIDE);
  });

  it('passes the instrument count and seed to the module', () => {
    const exports = fakeExports();

    createMarketGenerator(exports).init(5, 42);

    expect(exports.init).toHaveBeenCalledWith(5, 42);
  });

  it('rejects batch sizes outside 1..MAX_BATCH or not integers', () => {
    const generator = createMarketGenerator(fakeExports());

    for (const size of [0, 1001, 1.5, NaN]) {
      expect(() => generator.generate(size)).toThrow(RangeError);
    }
  });

  it('rejects instrument counts outside 1..MAX_INSTRUMENTS', () => {
    const generator = createMarketGenerator(fakeExports());

    for (const count of [0, 51, 2.5]) {
      expect(() => generator.init(count, 1)).toThrow(RangeError);
    }
  });

  it('refuses a module whose update layout differs from the app', () => {
    expect(() => createMarketGenerator(fakeExports({ UPDATE_STRIDE: i32(8) }))).toThrow(/layout/);
  });
});
