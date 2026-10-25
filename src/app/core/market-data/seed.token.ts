import { InjectionToken } from '@angular/core';

/** Gives each run a new generator seed. Tests provide a fixed one for repeatable runs. */
export const SEED_SOURCE = new InjectionToken<() => number>('SEED_SOURCE', {
  factory: () => randomSeed,
});

function randomSeed(): number {
  const [seed = 0] = crypto.getRandomValues(new Uint32Array(1)); // always set; satisfies the index check
  return seed;
}
