import { API_URL } from './api-url';

const NETWORK_RETRY_DELAYS_MS = [800, 1600, 2800] as const;

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response | null = null;
  let lastNetworkError: unknown;

  for (let attempt = 0; attempt <= NETWORK_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
        },
        cache: 'no-store',
      });
      break;
    } catch (error) {
      lastNetworkError = error;
      if (attempt === NETWORK_RETRY_DELAYS_MS.length) {
        break;
      }
      await wait(NETWORK_RETRY_DELAYS_MS[attempt]);
    }
  }

  if (!response) {
    console.error('API network failure', {
      path,
      baseUrl: API_URL,
      error: lastNetworkError,
    });
    throw new ApiError(
      'Unable to reach API after retries. Check backend URL, CORS settings, and network connectivity.',
      0,
    );
  }

  if (!response.ok) {
    const fallback = `Request failed (${response.status})`;
    let message = fallback;

    try {
      const body = (await response.json()) as {
        message?: string | string[];
      };
      if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // Use fallback when backend response is not JSON.
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export function getAuthHeader(token: string | null) {
  if (!token) {
    return {} as Record<string, string>;
  }

  return { Authorization: `Bearer ${token}` };
}
