export const TokenManager = Symbol('tokenManager');

export interface AuthorizeProps {
  /**
   * This is the redirect URL that the IDP should redirect to after authentication
   */
  redirectUrl?: string;

  /**
   * A client can optionally pass state along with the login flow.
   * This is just passed along and not looked at by the IDP.
   */
  state?: string;

  /**
   * The SHA256 hashed PKCE secret. The client needs to present
   * the original unhashed secret to complete the flow.
   *
   * This field is optional, if no challenge is provided by the client,
   * we fall back to running the flow without PKCE
   */
  pkceChallenge?: string;
}

export interface AuthorizeResponse {
  /**
   * This is the URL that the client must redirect to to start the auth flow
   */
  redirectUrl: string;
}

export interface ExchangeAuthCodeProps {
  /**
   * The single use authentication code that was received from the IDP.
   */
  authCode: string;

  /**
   * This is the redirect URL that the IDP should redirect to after logging out
   */
  redirectUrl?: string;

  /**
   * The original unhashed PKCE secret.
   */
  pkceVerifier?: string;
}

export interface ExchangeAuthCodeResponse {
  /**
   * The token returned by the IDP
   */
  token: string;

  /**
   * The refresh token returned by the IDP
   */
  refreshToken: string;
}

export interface RevokeTokenProps {
  /**
   * The token to revoke
   */
  token: string;

  /**
   * The refresh token to revoke
   */
  refreshToken: string;

  /**
   * This is the redirect URL that the IDP should redirect to after logging out
   */
  redirectUrl?: string;
}

export interface RevokeTokenResponse {
  /**
   * The client must perform a GET on this URL to inform the
   * IDP of a logout
   */
  logoutUrl: string;
}

export interface TokenManager {
  /**
   * Starts the Auth Code flow.
   */
  authorize(props: AuthorizeProps): Promise<AuthorizeResponse>;

  /**
   * Exchanges the single use Auth Code that was returned from the IDP for tokens.
   */
  exchangeAuthCodeForTokens(props: ExchangeAuthCodeProps): Promise<ExchangeAuthCodeResponse>;

  /**
   * Fetches a new id token. This would be used if a previous id token has expired.
   *
   * The client must present a valid refresh token.
   */
  refreshToken(refreshToken: string): Promise<string>;

  /**
   * Revokes a token (log out). The token is blocked in the system.
   *
   * This function also returns a URL which the client must perform a GET on to inform the
   * IDP of the logout.
   */
  revokeToken(props: RevokeTokenProps): Promise<RevokeTokenResponse>;
}
