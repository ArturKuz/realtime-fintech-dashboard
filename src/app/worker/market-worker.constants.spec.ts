import { GENERATOR_WASM_PATH } from './market-worker.constants';

describe('GENERATOR_WASM_PATH', () => {
  it('is relative, so it resolves under the base href of the deployed app', () => {
    const workerScript = 'https://example.github.io/realtime-fintech-dashboard/worker-ABC.js';

    expect(new URL(GENERATOR_WASM_PATH, workerScript).pathname).toBe(
      '/realtime-fintech-dashboard/wasm/generator.wasm',
    );
  });
});
