import { type ParseResult } from '@angular/forms/signals';

// Plain decimal notation only: Number() alone would also accept "0x10" and "Infinity".
const DECIMAL_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

/**
 * Reads the text of a number input. Empty text is "no value" (null, so `required` can report it);
 * text that is not a number keeps the previous value and reports a parse error instead.
 */
export function parseNumberInput(text: string): ParseResult<number | null> {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { value: null };
  }
  if (!DECIMAL_NUMBER.test(trimmed)) {
    return { error: { kind: 'parse', message: 'Enter a number, for example 100.' } };
  }
  return { value: Number(trimmed) };
}

export function formatNumberInput(value: number | null): string {
  return value === null ? '' : String(value);
}
