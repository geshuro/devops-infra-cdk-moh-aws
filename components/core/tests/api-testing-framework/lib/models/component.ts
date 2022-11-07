export interface Component {
  name: string;
  meta: ComponentMetadata;
  hasApiTestsDir: string;
  rootDir: string;
  apiTestsDir: string;
}

export interface ComponentMetadata {
  name: string;
  dependencies?: string[];
}
