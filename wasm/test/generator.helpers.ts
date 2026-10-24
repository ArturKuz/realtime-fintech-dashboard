import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type MarketGenerator } from '@worker/generator.model';
import { isGeneratorExports } from '@worker/generator.guards';
import { createMarketGenerator } from '@worker/generator.utils';

const WASM_PATH = fileURLToPath(new URL('../../public/wasm/generator.wasm', import.meta.url));

/** The compiled module, as built by `pnpm build:wasm`. */
export function compileGeneratorModule(): WebAssembly.Module {
  return new WebAssembly.Module(readFileSync(WASM_PATH));
}

/** A fresh instance (own memory and state), wrapped exactly as the worker wraps it. */
export function loadGenerator(): MarketGenerator {
  const instance = new WebAssembly.Instance(compileGeneratorModule(), {});
  if (!isGeneratorExports(instance.exports)) {
    throw new Error('generator.wasm does not have the expected exports');
  }
  return createMarketGenerator(instance.exports);
}
