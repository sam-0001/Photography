/**
 * HTTP Client with automatic cookie tracking, header management, and response normalization.
 */

export interface ApiResponse<T = any> {
  status: number;
  ok: boolean;
  data: T;
  rawText: string;
  buffer: Buffer;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  durationMs: number;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  cookieJar?: Record<string, string>;
  timeoutMs?: number;
}

export class ApiClient {
  public baseUrl: string;
  public cookies: Record<string, string> = {};

  constructor(baseUrl: string = process.env.TEST_BASE_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public setCookie(name: string, value: string) {
    this.cookies[name] = value;
  }

  public getCookie(name: string): string | undefined {
    return this.cookies[name];
  }

  public clearCookies() {
    this.cookies = {};
  }

  private buildCookieHeader(): string {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  private extractCookies(res: Response) {
    const rawSetCookie = res.headers.get('set-cookie');
    if (rawSetCookie) {
      // Split cookies (handling comma-separated cookies in header)
      const parts = rawSetCookie.split(/,(?=[^;]+;)/);
      for (const part of parts) {
        const [cookiePair] = part.split(';');
        const [name, val] = cookiePair.split('=');
        if (name && val) {
          this.cookies[name.trim()] = val.trim();
        }
      }
    }
  }

  public async request<T = any>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers: Record<string, string> = {
      Accept: 'text/html,application/xhtml+xml,application/json,*/*;q=0.9',
      ...options.headers
    };

    const cookieHeader = this.buildCookieHeader();
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    let payload: any = undefined;
    if (body !== undefined) {
      if (typeof FormData !== 'undefined' && body instanceof FormData) {
        // Fetch automatically calculates multipart boundary when Content-Type is not manually set
        payload = body;
        delete headers['Content-Type'];
      } else if (typeof body === 'string') {
        payload = body;
      } else {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
      }
    }

    const startTime = Date.now();
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: payload,
        signal: AbortSignal.timeout(options.timeoutMs || 8000)
      });

      this.extractCookies(res);

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const rawText = buffer.toString('utf-8');
      let data: unknown = rawText;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = rawText;
        }
      }

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        resHeaders[k.toLowerCase()] = v;
      });

      return {
        status: res.status,
        ok: res.ok,
        data: data as T,
        rawText,
        buffer,
        headers: resHeaders,
        cookies: { ...this.cookies },
        durationMs: Date.now() - startTime
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        status: 0,
        ok: false,
        data: { error: message || 'Network request failed' } as T,
        rawText: message,
        buffer: Buffer.alloc(0),
        headers: {},
        cookies: { ...this.cookies },
        durationMs: Date.now() - startTime
      };
    }
  }

  public get<T = any>(path: string, options?: RequestOptions) {
    return this.request<T>('GET', path, undefined, options);
  }

  public post<T = any>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>('POST', path, body, options);
  }

  public postMultipart<T = any>(path: string, formData: FormData, options?: RequestOptions) {
    return this.request<T>('POST', path, formData, options);
  }

  public patch<T = any>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>('PATCH', path, body, options);
  }

  public delete<T = any>(path: string, options?: RequestOptions) {
    return this.request<T>('DELETE', path, undefined, options);
  }
}
