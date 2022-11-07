export function firstString(stringOrStrings: string | string[]) {
  if (Array.isArray(stringOrStrings)) {
    return stringOrStrings[0];
  }
  return stringOrStrings;
}
