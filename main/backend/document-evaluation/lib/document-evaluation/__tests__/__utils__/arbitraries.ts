import { fc } from "jest-fast-check";
import { PicoType } from "../../pico-categories";

export const toArbitrary = <T>(as: T[]): fc.Arbitrary<T> =>
  fc.oneof(...as.map(a => fc.constant(a)));

export const picoCategoriesArbitrary = fc.record({
  p: fc.boolean(),
  i: fc.boolean(),
  c: fc.boolean(),
  o: fc.boolean(),
});
export const picoTypeArbitrary = fc.oneof(
  toArbitrary(Object.values(PicoType)),
  fc.string()
);
