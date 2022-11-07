import { ScreeningRequest } from './models/screening-request.config';

export const config: ScreeningRequest = {
  awsProfile: 'justdb',
  awsRegion: 'eu-west-2',
  clinicalQuestionIdentifier: 'liver_m',
  mlInputBucketName: '295054168699-justdb-ldn-mohjustdb-raw-metadata',
  screeningBucketName: '295054168699-justdb-ldn-mohjustdb-dummy-screenings',
  dbPrefix: '295054168699-justdb-ldn-mohjustdb-Screening-ScreeningStatus',
};
