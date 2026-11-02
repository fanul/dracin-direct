import { ErrorCode } from '../types';
import { logger } from '../observability/logger';

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  provider?: string;
  requestId?: string;
}

export interface CaptainResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export class CaptainError extends Error {
  code: ErrorCode;
  statusCode: number;
  provider?: string;

  constructor(code: ErrorCode, message: string, statusCode: number, provider?: string) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.provider = provider;
  }
}

export class CaptainClient {
  private baseHost = 'https://captain.sapimu.au';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async get<T>(
    url: string,
    config: RequestConfig = {}
  ): Promise<CaptainResponse<T>> {
    return this.request<T>('GET', url, undefined, config);
  }

  async post<T>(
    url: string,
    body: unknown,
    config: RequestConfig = {}
  ): Promise<CaptainResponse<T>> {
    return this.request<T>('POST', url, body, config);
  }

  private async request<T>(
    method: string,
    url: string,
    body: unknown,
    config: RequestConfig
  ): Promise<CaptainResponse<T>> {
    const {
      timeout = 10000,
      retries = 2,
      retryDelay = 1000,
      provider,
      requestId,
    } = config;

    let fullUrl = url.startsWith('http') ? url : `${this.baseHost}${url}`;

    if (provider === 'dramanova' && !/[?&]lang=/i.test(fullUrl)) {
      const separator = fullUrl.includes('?') ? '&' : '?';
      fullUrl = `${fullUrl}${separator}lang=in`;
    }

    const startTime = Date.now();

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(fullUrl, {
          method,
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'X-Request-Id': requestId || 'unknown',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const latency = Date.now() - startTime;
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });

        logger.info('captain_request', {
          provider,
          method,
          url: fullUrl,
          statusCode: response.status,
          latencyMs: latency,
          requestId,
        });

        if (response.status === 429) {
          const retryAfter = headers['retry-after'];
          if (attempt < retries) {
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : retryDelay * Math.pow(2, attempt);
            logger.warn('rate_limited_retry', { provider, attempt, delay, requestId });
            await this.sleep(delay);
            continue;
          }
          throw new CaptainError('RATE_LIMITED', 'Rate limit exceeded', 429, provider);
        }

        if (response.status >= 500) {
          if (attempt < retries) {
            logger.warn('server_error_retry', { provider, attempt, statusCode: response.status, requestId });
            await this.sleep(retryDelay * Math.pow(2, attempt));
            continue;
          }
          throw new CaptainError('UPSTREAM_ERROR', `Server error ${response.status}`, response.status, provider);
        }

        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'Unknown error');
          throw new CaptainError(
            'UPSTREAM_ERROR',
            `Request failed: ${response.status} - ${errorBody}`,
            response.status,
            provider
          );
        }

        const data = await response.json() as T;
        return { data, status: response.status, headers };

      } catch (error) {
        if (error instanceof CaptainError) {
          throw error;
        }

        if (error instanceof Error && error.name === 'AbortError') {
          if (attempt < retries) {
            logger.warn('timeout_retry', { provider, attempt, requestId });
            await this.sleep(retryDelay * Math.pow(2, attempt));
            continue;
          }
          throw new CaptainError('UPSTREAM_TIMEOUT', 'Request timeout', 408, provider);
        }

        throw new CaptainError('UPSTREAM_ERROR', error instanceof Error ? error.message : 'Unknown error', 500, provider);
      }
    }

    throw new CaptainError('UPSTREAM_ERROR', 'Max retries exceeded', 500, provider);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const createCaptainClient = (token: string): CaptainClient => new CaptainClient(token);
