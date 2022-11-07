# Start Screening Request tool

## Config

1. Create the file `lib/screening-request.config.ts` and populate it like this:

```ts
export const config: ScreeningRequest = {
  awsProfile: <profile>,
  awsRegion: <region>,
  clinicalQuestionIdentifier: <question identifier>, // Should be one of our pre-populated dummy data screening request identifiers: ['gcc_cpp', 'liver_m', 'liver_p', 'prostate_m', 'prostate_p']
  screeningBucketName: <bucket>, 
  dbPrefix: <prefix>,
};
```

## Running

```bash
> pnpm start
```

Stop with `CTRL+C` or let it run to completion.
