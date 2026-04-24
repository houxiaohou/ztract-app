const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_CALLBACK_PATH = '/auth/google';

export const OAUTH_STATE_KEY = 'ztract.oauth_state';

function randomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function redirectToGoogle(clientId: string): void {
  const state = randomToken();
  const nonce = randomToken();
  sessionStorage.setItem(OAUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${window.location.origin}${GOOGLE_CALLBACK_PATH}`,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
    state,
    prompt: 'select_account',
  });

  window.location.assign(`${AUTH_ENDPOINT}?${params.toString()}`);
}
