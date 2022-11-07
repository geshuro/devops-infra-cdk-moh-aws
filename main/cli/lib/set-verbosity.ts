export function setVerbosity(verbose: boolean) {
  if (verbose) {
    process.env.VERBOSE = 'true';
  }
  return !!verbose;
}
