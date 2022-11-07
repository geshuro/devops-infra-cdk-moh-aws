export interface DeploymentItemKey {
  type: string;
  id: string;
}

export interface DeploymentItem extends DeploymentItemKey {
  value?: string;
}
