/**
 * Fictional instrument symbols. The generator works with indices only; the main thread maps an
 * index to its symbol, so strings never cross the Wasm or worker boundary.
 */
// prettier-ignore
export const INSTRUMENT_SYMBOLS: readonly string[] = [
  'ALFA', 'BETA', 'GAMA', 'DLTA', 'ACME', 'BOLT', 'CRUX', 'DUNE', 'ECHO', 'FLUX',
  'GRID', 'HALO', 'IRIS', 'JADE', 'KITE', 'LYNX', 'MESA', 'NOVA', 'ONYX', 'PIKE',
  'QUAY', 'RUNE', 'SAGE', 'TIDE', 'UMBR', 'VOLT', 'WISP', 'XENO', 'YARD', 'ZINC',
  'AXIS', 'BLUE', 'CORE', 'DAWN', 'EDGE', 'FERN', 'GLOW', 'HAWK', 'ISLE', 'JOLT',
  'KELP', 'LOOM', 'MINT', 'NEST', 'OPAL', 'PEAK', 'REEF', 'SILK', 'TUSK', 'VALE',
];

export function symbolOf(index: number): string {
  const symbol = INSTRUMENT_SYMBOLS[index];
  if (symbol === undefined) {
    throw new RangeError(`No instrument symbol for index ${index}`);
  }
  return symbol;
}
