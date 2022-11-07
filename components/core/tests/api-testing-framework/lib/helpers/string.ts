import _ from 'lodash';

// remove the "end" string from "str" if it exists
export function chopRight(str = '', end = ''): string {
  if (!_.endsWith(str, end)) return str;
  if (end.length >= str.length) return str;
  return str.substring(0, str.length - end.length);
}

// remove the "start" string from "str" if it exists
export function chopLeft(str = '', start = ''): string {
  if (!_.startsWith(str, start)) return str;
  return str.substring(start.length);
}

export const truncateOrDefault = (str: string): string => _.truncate(str || 'default');
