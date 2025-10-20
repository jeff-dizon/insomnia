import { getApiBaseURL, getClientString, INSOMNIA_FETCH_TIME_OUT, PLAYWRIGHT } from '../common/constants';
import { generateId } from '../common/misc';

interface FetchConfig {
  method: 'POST' | 'PUT' | 'GET' | 'DELETE' | 'PATCH';
  path: string;
  sessionId?: string | null;
  organizationId?: string | null;
  data?: unknown;
  retries?: number;
  origin?: string;
  headers?: Record<string, string>;
  onlyResolveOnSuccess?: boolean;
  timeout?: number;
}

export class ResponseFailError extends Error {
  constructor(msg: string, response: Response) {
    super(msg);
    this.response = response;
  }
  response;
  name = 'ResponseFailError';
}

let loginPromise: Promise<any> | null = null;

export async function customFetch<T = void>(config: FetchConfig): Promise<T> {
  // Only trigger login once
  if (!loginPromise) {
    loginPromise = window.main.login();
  }

  let account;
  try {
    account = await loginPromise;
  } finally {
    // Reset the promise if login failed or succeeded
    loginPromise = null;
  }

  const fetchConfig: RequestInit = {
    method: config.method,
    headers: {
      ...config.headers,
      'X-Insomnia-Client': getClientString(),
      'insomnia-request-id': generateId('desk'),
      'X-Origin': config.origin || getApiBaseURL(),
      'Authorization': account ? `Bearer ${account.accessToken}` : '',
      ...(config.sessionId ? { 'X-Session-Id': config.sessionId } : {}),
      ...(config.data ? { 'Content-Type': 'application/json' } : {}),
      ...(config.organizationId ? { 'X-Insomnia-Org-Id': config.organizationId } : {}),
      ...(PLAYWRIGHT ? { 'X-Mockbin-Test': 'true' } : {}),
    },
    ...(config.data ? { body: JSON.stringify(config.data) } : {}),
    signal: AbortSignal.timeout(config.timeout || INSOMNIA_FETCH_TIME_OUT),
  };

  try {
    const response = await fetch((config.origin || getApiBaseURL()) + config.path, fetchConfig);

    const uri = response.headers.get('x-insomnia-command');
    if (uri) {
      window.main.openDeepLink(uri);
    }

    const isJson = response.headers.get('content-type')?.includes('application/json') || config.path.match(/\.json$/);

    if (config.onlyResolveOnSuccess && !response.ok) {
      let errMsg = '';
      if (isJson) {
        try {
          const json = await response.json();
          if (typeof json?.message === 'string') errMsg = json.message;
        } catch {}
      }
      throw new ResponseFailError(errMsg, response);
    }

    return await (isJson ? response.json() : (response.text() as Promise<T>));
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('custom fetch timed out');
    throw err;
  }
}
