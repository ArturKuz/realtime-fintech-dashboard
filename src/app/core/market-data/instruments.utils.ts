import { INSTRUMENT_SYMBOLS } from './instruments.constants';

export function symbolOf(index: number): string {
  const symbol = INSTRUMENT_SYMBOLS[index];
  if (symbol === undefined) {
    throw new RangeError(`No instrument symbol for index ${index}`);
  }
  return symbol;
}
