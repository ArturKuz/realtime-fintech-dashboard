import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { UPDATE_STRIDE } from '@core/protocol/market-update-layout.constants';
import { loadGenerator } from '@worker/wasm-loader';

const WASM_BYTES = readFileSync(
  fileURLToPath(new URL('../../public/wasm/generator.wasm', import.meta.url)),
);

describe('loadGenerator with the compiled module', () => {
  it('downloads, compiles and wraps the real generator', async () => {
    const fetchFn = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(WASM_BYTES, { headers: { 'Content-Type': 'application/wasm' } }),
      ),
    );

    const generator = await loadGenerator('wasm/generator.wasm', fetchFn);
    generator.init(5, 42);

    expect(generator.generate(10)).toHaveLength(10 * UPDATE_STRIDE);
  });

  it('works when the server sends a wrong content type (no streaming compile)', async () => {
    const fetchFn = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(WASM_BYTES, { headers: { 'Content-Type': 'text/plain' } })),
    );

    const generator = await loadGenerator('wasm/generator.wasm', fetchFn);

    expect(generator.maxBatch).toBe(1000);
  });
});
