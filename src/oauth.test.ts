import { describe, it, expect, vi } from 'vitest';
import { connectUrl, exchangeCode, refreshAccessToken, IntegrationTokenError } from './oauth.js';

const json = (status: number, body: unknown) =>
  Promise.resolve({ ok: status < 300, status, json: () => Promise.resolve(body) } as Response);

describe('Connect to Dispatch helpers', () => {
  it('builds the consent link', () => {
    const url = new URL(connectUrl({ clientId: 'iap_1', redirectUri: 'https://x.dev/cb', state: 's1', codeChallenge: 'c'.repeat(43) }));
    expect(url.origin + url.pathname).toBe('https://app.dispatchtickets.com/integrations/authorize');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: 'iap_1',
      redirect_uri: 'https://x.dev/cb',
      state: 's1',
      code_challenge: 'c'.repeat(43),
      code_challenge_method: 'S256',
    });
  });

  it('exchanges a code with a form-encoded POST carrying the client credentials', async () => {
    const tokens = { access_token: 'dti_at_1', refresh_token: 'dti_rt_1', token_type: 'Bearer', expires_in: 3600 };
    const fetch = vi.fn(() => json(200, tokens));
    const out = await exchangeCode({ clientId: 'iap_1', clientSecret: 'dti_cs_x', code: 'dti_code_1', redirectUri: 'https://x.dev/cb', fetch });
    expect(out).toEqual(tokens);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.dispatchtickets.com/v1/oauth/token');
    expect(Object.fromEntries(new URLSearchParams(init.body as string))).toEqual({
      grant_type: 'authorization_code',
      code: 'dti_code_1',
      redirect_uri: 'https://x.dev/cb',
      client_id: 'iap_1',
      client_secret: 'dti_cs_x',
    });
  });

  it('surfaces the OAuth error code', async () => {
    const fetch = vi.fn(() => json(400, { error: 'invalid_grant', error_description: 'Refresh token already used' }));
    const err = await refreshAccessToken({ clientId: 'iap_1', clientSecret: 's', refreshToken: 'dti_rt_old', fetch }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(IntegrationTokenError);
    expect(err).toMatchObject({ error: 'invalid_grant', status: 400, message: 'Refresh token already used' });
  });
});
