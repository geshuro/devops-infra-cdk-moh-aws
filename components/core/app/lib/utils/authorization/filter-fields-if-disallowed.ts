import _ from 'lodash';

export interface FilterFieldsIfDisallowedProps<T> {
  /**
   * The fields that will be checked against permissions
   */
  fieldsToCheck: (keyof T)[];

  /**
   * Function that should return `true` if a field is allowed.
   * If this function returns `false`, that field will be filtered out
   */
  isAllowed: (field: keyof T) => boolean;
}

/**
 * Filters fields from an object if a field is not allowed.
 *
 * @returns Function that filters fields which are not allowed.
 */
export function filterFieldsIfDisallowed<T extends object>(
  props: FilterFieldsIfDisallowedProps<T>,
): (item: T) => Partial<T> {
  const fieldsToOmit: (keyof T)[] = [];
  props.fieldsToCheck.forEach((fieldToCheck) => {
    if (!props.isAllowed(fieldToCheck)) {
      fieldsToOmit.push(fieldToCheck);
    }
  });
  // eslint-disable-next-line you-dont-need-lodash-underscore/omit
  return (item: T) => _.omit(item, fieldsToOmit) as Partial<T>;
}
