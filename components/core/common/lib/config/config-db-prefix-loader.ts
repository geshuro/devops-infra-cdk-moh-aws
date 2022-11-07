export const configDbPrefixLoader = () => {
  const dbPrefix = process.env.APP_DB_PREFIX;
  if (!dbPrefix) {
    throw Error('APP_DB_PREFIX is not defined');
  }
  return `${dbPrefix}-`;
};
