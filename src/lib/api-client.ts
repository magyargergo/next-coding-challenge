type Locale = 'uk' | 'us';

interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
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
  // Use relative URLs in all environments to avoid external domain protection (e.g., Vercel preview auth)
  const baseUrl = '';

  return new ApiClient({
    baseUrl,
    timeout: 10000,
  });
}

// Convenience exports
export const api = createApiClient();
export type { Locale };
