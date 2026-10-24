import { UPDATE_STRIDE } from '@core/protocol/market-update-layout.constants';
import { type GeneratorExports, type MarketGenerator } from './generator.model';

/**
 * Wraps the raw module exports. Both the worker (browser) and the generator tests (Node) use this,
 * so the tests exercise the same code path as the app.
 */
export function createMarketGenerator(exports: GeneratorExports): MarketGenerator {
  const maxInstruments = readI32(exports.MAX_INSTRUMENTS, 'MAX_INSTRUMENTS');
  const maxBatch = readI32(exports.MAX_BATCH, 'MAX_BATCH');
  const updateStride = readI32(exports.UPDATE_STRIDE, 'UPDATE_STRIDE');
  if (updateStride !== UPDATE_STRIDE) {
    throw new Error(
      `Generator update layout has ${updateStride} values per update; the app expects ${UPDATE_STRIDE}`,
    );
  }

  return {
    maxInstruments,
    maxBatch,
    updateStride,
    init(instrumentCount: number, seed: number): void {
      assertIntegerInRange('Instrument count', instrumentCount, 1, maxInstruments);
      exports.init(instrumentCount, seed);
    },
    generate(updateCount: number): Int32Array {
      assertIntegerInRange('Batch size', updateCount, 1, maxBatch);
      const address = exports.generate(updateCount);
      // A fresh view on every call: if Wasm memory grows, earlier ArrayBuffers are detached.
      return new Int32Array(exports.memory.buffer, address, updateCount * updateStride);
    },
  };
}

function readI32(global: WebAssembly.Global, name: string): number {
  const value: unknown = global.value;
  if (typeof value !== 'number') {
    throw new Error(`Generator export ${name} is not a number`);
  }
  return value;
}

function assertIntegerInRange(what: string, value: number, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${what} must be an integer in ${min}..${max}, got ${value}`);
  }
}
