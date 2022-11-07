export type CliPhase = number;

export const enum CliPhaseName {
  Start = 0,

  PreBuild = 9,
  Build = 10,
  PostBuild = 11,

  PreDeploy = 19,
  Deploy = 20,
  PostDeploy = 21,
}
