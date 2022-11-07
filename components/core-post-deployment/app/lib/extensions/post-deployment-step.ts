export const PostDeploymentStep = Symbol('postDeploymentStep');

export interface PostDeploymentStep {
  execute(): Promise<void>;

  cleanup?(): Promise<void>;
}
