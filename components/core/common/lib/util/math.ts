import _ from 'lodash';

/**
 * @param numbers to sum
 * @returns       sum of numbers */
export const sum = (numbers: readonly number[]): number =>
  _.reduce(numbers, (total, number) => total + number, 0);

/**
 * @param numbers to average
 * @returns       average of numbers */
export const average = (numbers: readonly number[]): number =>
  numbers.length === 0 ? 0 : sum(numbers) / numbers.length;
