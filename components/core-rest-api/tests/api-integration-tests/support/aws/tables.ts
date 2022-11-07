// Returns table names without the prefix
export async function tableNames() {
  return [
    'authenticationProviderConfigs',
    'authenticationProviderTypes',
    'locks',
    'passwords',
    'revokedTokens',
    'userRoles',
    'users',
  ];
}
