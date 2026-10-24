import { UPDATE_FIELD, UPDATE_STRIDE } from './market-update-layout.constants';

describe('market update layout', () => {
  it('describes the 7 values the generator writes per update, in order', () => {
    expect(UPDATE_FIELD).toEqual({
      instrument: 0,
      priceCents: 1,
      tradeQty: 2,
      bidCents: 3,
      askCents: 4,
      bidQty: 5,
      askQty: 6,
    });
  });

  it('has a stride equal to the number of fields, with no gaps', () => {
    const offsets = Object.values(UPDATE_FIELD).sort((a, b) => a - b);

    expect(UPDATE_STRIDE).toBe(7);
    expect(offsets).toEqual([...Array(UPDATE_STRIDE).keys()]);
  });
});
