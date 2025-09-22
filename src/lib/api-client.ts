type Locale = 'uk' | 'us';

interface ApiConfig {
  timeout: number;
}

class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private async resolveUrl(endpoint: string): Promise<string> {
    // Client-side: use relative URLs
    if (typeof window !== 'undefined') {
      return endpoint;
    }

    // Server-side: build absolute URL with proper headers
    try {
      const { headers } = await import('next/headers');
      const h = headers();
      const host = h.get('host') || process.env.VERCEL_URL || 'localhost:3000';
      const proto = h.get('x-forwarded-proto') || (process.env.VERCEL_URL ? 'https' : 'http');
      return `${proto}://${host}${endpoint}`;
    } catch {
      const host = process.env.VERCEL_URL || 'localhost:3000';
      const proto = process.env.VERCEL_URL ? 'https' : 'http';
      return `${proto}://${host}${endpoint}`;
    }
  }

  private async buildHeaders(options: RequestInit): Promise<HeadersInit> {
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    // Forward authentication cookies on server-side
    if (typeof window === 'undefined') {
      try {
        const { headers } = await import('next/headers');
        const cookie = headers().get('cookie');
        if (cookie) baseHeaders.cookie = cookie;
      } catch {
        // Ignore header access errors
      }
    }

    return baseHeaders;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const [url, headers] = await Promise.all([
        this.resolveUrl(endpoint),
        this.buildHeaders(options)
      ]);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getProducts(locale: Locale = 'uk'): Promise<Product[]> {
    return this.request<Product[]>(`/api/products?locale=${locale}`);
  }

  async getMoreProducts(locale: Locale = 'uk'): Promise<Product[]> {
    try {
      return this.request<Product[]>(`/api/products?type=more-products&locale=${locale}`);
    } catch {
      return [];
    }
  }

}

// Types
export interface Product {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  currency: string;
}


// Factory function for environment-aware client
export function createApiClient(): ApiClient {
  return new ApiClient({
    timeout: 10000,
  });
}

// Convenience exports
export const api = createApiClient();
export type { Locale };
