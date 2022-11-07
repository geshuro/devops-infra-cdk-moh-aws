export interface RuleTarget {
  id: string;
  targetArn: string;
  inputTransformer?: {
    pathsMap: string;
    template: string;
  };
}
