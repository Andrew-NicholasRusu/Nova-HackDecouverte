/**
 * Concordia Open Data API client (SERVER ONLY).
 *
 * Credentials come from server-side env vars (never EXPO_PUBLIC_*), so they are
 * never shipped in the client bundle. Only import this from `+api.ts` routes or
 * other server-only modules. See PLAN.md §7 (secrets) and §8 (adapter).
 *
 * Auth: HTTP Basic over HTTPS, user = application ID, password = API key.
 * Docs: https://github.com/opendataConcordiaU/documentation
 */

const BASE_URL = 'https://opendata.concordia.ca/API/v1/';

export class ConcordiaApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ConcordiaApiError';
  }
}

function getCredentials() {
  const user = process.env.CONCORDIA_API_USER;
  const key = process.env.CONCORDIA_API_KEY;
  if (!user || !key) {
    throw new ConcordiaApiError(
      'Missing CONCORDIA_API_USER / CONCORDIA_API_KEY. Copy .env.example to .env.local and fill them in.',
      500,
    );
  }
  return { user, key };
}

/**
 * GET an endpoint, e.g. `concordiaGet<RawBuilding[]>('facilities/buildinglist', { trailingSlash: true })`.
 * Endpoints disagree about trailing slashes (verified 2026-11-14): facilities/buildinglist returns
 * HTTP 500 without one, while course/* filters return HTTP 500 *with* one.
 */
export async function concordiaGet<T>(
  path: string,
  { trailingSlash = false }: { trailingSlash?: boolean } = {},
): Promise<T> {
  const { user, key } = getCredentials();
  const clean = path.replace(/^\/+/, '').replace(/\/+$/, '');
  const url = BASE_URL + clean + (trailingSlash ? '/' : '');
  const auth = btoa(`${user}:${key}`);

  const res = await fetch(url, {
    headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
  });

  if (res.status === 401) {
    throw new ConcordiaApiError('Concordia API rejected the credentials.', 401);
  }
  if (!res.ok) {
    throw new ConcordiaApiError(`Concordia API error (HTTP ${res.status}).`, res.status);
  }
  return (await res.json()) as T;
}
