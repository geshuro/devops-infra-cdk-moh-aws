export interface ScreeningRequest {
  awsProfile: string;
  awsRegion: string;
  clinicalQuestionIdentifier: string; // Should be one of: ['gcc_cpp', 'liver_m', 'liver_p', 'prostate_m', 'prostate_p']
  mlInputBucketName: string; // Destination location bucket for metadata
  pdfBucketName: string; // Destination bucket for pdfs
  screeningBucketName: string; // Location of bucket that contains dummy data
  dbPrefix: string; // prefix for screening DDB table
}
