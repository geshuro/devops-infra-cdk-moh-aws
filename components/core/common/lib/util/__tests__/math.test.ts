import { fc, itProp } from 'jest-fast-check';
import { average, sum } from '../math';

describe('math', () => {
  const total = (numbers: number[]) => {
    let total = 0;
    numbers.forEach(number => {
      total += number;
    });
    return total;
  };
  describe('sum', () => {
    itProp(
      'returns total for any numeric array',
      [fc.array(fc.double())],
      numbers => expect(sum(numbers)).toBe(total(numbers))
    );
  });
  describe('average', () => {
    itProp(
      'returns average for any numeric array',
      [fc.array(fc.double())],
      numbers =>
        expect(average(numbers)).toBe(
          numbers.length ? total(numbers) / numbers.length : 0
        )
    );
  });
});
