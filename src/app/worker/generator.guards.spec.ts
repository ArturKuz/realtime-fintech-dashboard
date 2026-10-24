import { isGeneratorExports } from './generator.guards';

const i32 = (value: number): WebAssembly.Global =>
  new WebAssembly.Global({ value: 'i32', mutable: false }, value);

function validExports(): Record<string, unknown> {
  return {
    memory: new WebAssembly.Memory({ initial: 1 }),
    init: () => undefined,
    generate: () => 0,
    MAX_INSTRUMENTS: i32(50),
    MAX_BATCH: i32(1000),
    UPDATE_STRIDE: i32(7),
  };
}

describe('isGeneratorExports', () => {
  it('accepts the exports the generator module provides', () => {
    expect(isGeneratorExports(validExports())).toBe(true);
  });

  it('rejects values that are not objects', () => {
    expect(isGeneratorExports(null)).toBe(false);
    expect(isGeneratorExports(undefined)).toBe(false);
  });

  it('rejects exports without linear memory', () => {
    expect(isGeneratorExports({ ...validExports(), memory: undefined })).toBe(false);
  });

  it('rejects exports whose functions are missing', () => {
    expect(isGeneratorExports({ ...validExports(), init: undefined })).toBe(false);
    expect(isGeneratorExports({ ...validExports(), generate: 42 })).toBe(false);
  });

  it('rejects exports whose limits are not globals', () => {
    expect(isGeneratorExports({ ...validExports(), MAX_BATCH: 1000 })).toBe(false);
    expect(isGeneratorExports({ ...validExports(), UPDATE_STRIDE: undefined })).toBe(false);
  });
});
