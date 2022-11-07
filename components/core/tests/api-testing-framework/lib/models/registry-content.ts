/**
 * A map of the keys and values. However, the values are objects that contain the value and the sources
 * where the value came from.  An example of the content can be:
 * {'key': { value: <value>: sources: [{ name: <component>, file: <file> }] }}
 * With this data structure we are able to list where each value came from and which component
 * overrides another component's value.
 */
export type RegistryContent = Record<string, any>;

export interface RegistryContentEntry {
  value: unknown;
  sources: RegistryContentEntrySource[];
}

export interface RegistryContentEntrySource {
  name: string;
  file: string;
}
