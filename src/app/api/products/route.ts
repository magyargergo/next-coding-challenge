import { NextRequest } from 'next/server';

type ProductType = 'products' | 'more-products';
type LocaleKey = 'uk' | 'us';

const UPSTREAM_BY_TYPE: Record<ProductType, string> = {
  products: 'https://v0-api-endpoint-request.vercel.app/api/products',
  'more-products': 'https://v0-api-endpoint-request.vercel.app/api/more-products'
};

type UpstreamProduct = {
  id: number;
  name?: { uk?: string; us?: string };
  price?: { gbp?: number; usd?: number };
  stock?: number;
};

type UpstreamResponse = { success?: boolean; products?: UpstreamProduct[] };

type TransformedProduct = {
  id: string | number;
  name: string;
  description: string;
  price: number;
  currency: 'GBP' | 'USD';
};

function parseLocale(param: string | null): LocaleKey {
  return param === 'us' ? 'us' : 'uk';
}

function buildCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function toTransformedProducts(data: UpstreamResponse, type: ProductType, locale: LocaleKey): TransformedProduct[] {
  if (!data?.success || !Array.isArray(data.products)) return [];
  return data.products.map((p, index) => ({
    id: type === 'more-products' ? `more-${p.id}` : p.id ?? index,
    name: (locale === 'us' ? p.name?.us : p.name?.uk) || p.name?.uk || p.name?.us || `Product ${p.id}`,
    description: `Stock: ${p.stock ?? 0}`,
    price: (locale === 'us' ? p.price?.usd : p.price?.gbp) ?? p.price?.gbp ?? p.price?.usd ?? 0,
    currency: locale === 'us' ? 'USD' as const : 'GBP' as const
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get('type') as ProductType) || 'products';
  const locale = parseLocale(searchParams.get('locale'));

  try {
    const upstream = UPSTREAM_BY_TYPE[type];
    const upstreamRes = await fetch(upstream, { headers: { Accept: 'application/json' } });
    if (!upstreamRes.ok) throw new Error(`Upstream ${upstreamRes.status}`);
    const json = (await upstreamRes.json()) as UpstreamResponse;
    const products = toTransformedProducts(json, type, locale);
    return Response.json(products, { headers: buildCorsHeaders() });
  } catch {
    return Response.json([], { status: 500, headers: buildCorsHeaders() });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: buildCorsHeaders() });
}