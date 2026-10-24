/** Raw exports of the compiled generator module (wasm/assembly/index.ts). */
export interface GeneratorExports {
  readonly memory: WebAssembly.Memory;
  readonly init: (instrumentCount: number, seed: number) => void;
  /** Writes `updateCount` updates into the output buffer and returns its address in memory. */
  readonly generate: (updateCount: number) => number;
  readonly MAX_INSTRUMENTS: WebAssembly.Global;
  readonly MAX_BATCH: WebAssembly.Global;
  readonly UPDATE_STRIDE: WebAssembly.Global;
}

/** The generator as the worker uses it: a typed wrapper around the raw exports. */
export interface MarketGenerator {
  readonly maxInstruments: number;
  readonly maxBatch: number;
  readonly updateStride: number;
  /** Resets all per-instrument state and the random sequence. */
  init(instrumentCount: number, seed: number): void;
  /**
   * Generates one batch. The returned view points into Wasm memory and is overwritten by the next
   * call, so read it before generating again.
   */
  generate(updateCount: number): Int32Array;
}
