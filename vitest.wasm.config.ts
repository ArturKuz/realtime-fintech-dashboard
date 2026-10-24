// Runs the generator tests against the compiled .wasm in Node (they read the file from disk).
// The Angular unit tests run separately through `ng test`.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ['wasm/test/**/*.spec.ts'],
    environment: 'node',
  },
});
