import { type GeneratorExports } from './generator.model';

/** Checks that an instantiated module really is our generator before anything calls into it. */
export function isGeneratorExports(exports: unknown): exports is GeneratorExports {
  if (typeof exports !== 'object' || exports === null) {
    return false;
  }
  const candidate = exports as Record<string, unknown>;
  return (
    candidate['memory'] instanceof WebAssembly.Memory &&
    typeof candidate['init'] === 'function' &&
    typeof candidate['generate'] === 'function' &&
    candidate['MAX_INSTRUMENTS'] instanceof WebAssembly.Global &&
    candidate['MAX_BATCH'] instanceof WebAssembly.Global &&
    candidate['UPDATE_STRIDE'] instanceof WebAssembly.Global
  );
}
