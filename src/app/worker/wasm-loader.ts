import { GeneratorLoadError } from './generator-load-error';
import { isGeneratorExports } from './generator.guards';
import { type MarketGenerator } from './generator.model';
import { createMarketGenerator } from './generator.utils';
import { PRODUCER_ERRORS } from './worker-errors.constants';

/**
 * Downloads, compiles and instantiates the generator module. Every failure becomes a
 * GeneratorLoadError with a message written for the user.
 *
 * Uses fetch → arrayBuffer → compile rather than instantiateStreaming: the module is ~1 KB, so
 * streaming gains nothing, and it would fail on servers that send the wrong MIME type.
 */
export async function loadGenerator(
  url: string | URL,
  fetchFn: typeof fetch = fetch,
): Promise<MarketGenerator> {
  // Checked through globalThis: the global may be missing entirely in old browsers.
  if (typeof (globalThis as { WebAssembly?: unknown }).WebAssembly !== 'object') {
    throw new GeneratorLoadError(PRODUCER_ERRORS.unsupported);
  }

  const bytes = await download(url, fetchFn);

  let instance: WebAssembly.Instance;
  try {
    instance = await WebAssembly.instantiate(await WebAssembly.compile(bytes), {});
  } catch {
    throw new GeneratorLoadError(PRODUCER_ERRORS.invalidModule);
  }

  if (!isGeneratorExports(instance.exports)) {
    throw new GeneratorLoadError(PRODUCER_ERRORS.invalidModule);
  }
  try {
    return createMarketGenerator(instance.exports);
  } catch {
    throw new GeneratorLoadError(PRODUCER_ERRORS.invalidModule);
  }
}

async function download(url: string | URL, fetchFn: typeof fetch): Promise<ArrayBuffer> {
  try {
    const response = await fetchFn(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.arrayBuffer();
  } catch {
    throw new GeneratorLoadError(PRODUCER_ERRORS.downloadFailed);
  }
}
