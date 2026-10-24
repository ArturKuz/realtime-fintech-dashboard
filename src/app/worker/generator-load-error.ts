/** A generator loading failure whose message is already written for the user. */
export class GeneratorLoadError extends Error {
  override readonly name = 'GeneratorLoadError';
}
