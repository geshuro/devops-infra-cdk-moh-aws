export interface CoreCicdStageConfig {
  /**
   * The region of the pipeline account.
   * This should be the same region where the code repository is.
   */
  cicdAwsRegion: string;

  /**
   * This is the account where the pipeline will live.
   * This should be the same account that hosts the CodeCommit Repo
   */
  cicdAwsProfile: string;

  /**
   * The name of the CodeCommit repository
   */
  repositoryName: string;

  /**
   * The branch to be deployed
   */
  branch: string;
}
