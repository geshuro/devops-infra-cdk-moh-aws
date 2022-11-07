export type DependencyType = 'component' | 'framework' | 'solution';

export interface Dependency {
  name: string;
  testsDir: string;
  type: DependencyType;
}

export type DependencyGraph = Dependency[];
