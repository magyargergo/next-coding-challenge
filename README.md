# Michael’s Next.js Coding Challenge

<div align="right">
  <a href="https://next-coding-challenge-mu.vercel.app" target="_blank">
    <img src="https://img.shields.io/website?url=https%3A%2F%2Fnext-coding-challenge-mu.vercel.app&label=%F0%9F%8C%90%20Live%20Site&up_message=online&down_message=offline&up_color=00C896&down_color=FF6B6B&style=flat-square&labelColor=2D3748" alt="Live Site" />
  </a>
  &nbsp;
  <a href="https://github.com/magyargergo/next-coding-challenge/deployments/activity_log?environment=Production" target="_blank">
    <img src="https://img.shields.io/github/deployments/magyargergo/next-coding-challenge/Production?label=%E2%96%B2%20Deploy&logo=vercel&logoColor=white&style=flat-square&color=000000&labelColor=2D3748" alt="Vercel Deployment" />
  </a>
</div>

A production-grade e‑commerce storefront built with the App Router. The brief came with TODOs, flaky tests, and awkward state. I cleaned it up with a small, testable core, strong typing, and a simple i18n model that can scale.

---

## Highlights

- **Fast first paint:** products are rendered on the server (no loading spinners).
- **Thin proxy API:** one internal endpoint normalises the upstream data and avoids CORS.
- **Solid cart state:** minimal Zustand store, persisted, with selectors for totals/quantities.
- **Locale routing:** `/en-GB` (UK, GBP) and `/en-US` (US, USD) out of the box.
- **Progressive fetching:** “more products” loads after render via the same proxy.
- **Checkout basics:** line items and total quantity.
- **CI/CD ready:** tests on every push; deploy on `main`.
 - **Unified design system:** Tailwind v4 with semantic tokens and small component classes (minimal custom CSS).
 - **Polished loading UX:** staged loading for more products (overlay → skeletons → content) with no layout shift.

---

## What’s inside

- **App Router + Server Components** for product SSR and small client bundles.
- **Single internal API:** `GET /api/products` fetches upstream and returns a normalised array.
- **Currency and locale utilities:** `Intl.NumberFormat` wrapped by a tiny helper.
- **Zustand cart:** persisted store with derived selectors (total quantity, unique items).
- **`next-intl` messages** with a `[locale]` segment and middleware redirect.
- **TypeScript everywhere** with small, predictable types.
 - **Tailwind CSS v4** via `@tailwindcss/postcss`, with design tokens in `@theme` and semantic classes (e.g. `btn`, `card`).
 - **A11y-first**: focus-visible rings; loading overlay uses `aria-live` without layout shift.

---

## Folder structure (short tour)

```
src/
  app/
    [locale]/
      page.tsx            # SSR product list
      checkout/page.tsx   # checkout summary
      layout.tsx          # per-locale messages + provider
    api/
      products/route.ts   # proxy + normalise upstream product data
  lib/
    api-client.ts         # environment-aware API client
    currency.ts           # formatCurrency(locale,currency)
  messages/               # per-locale json messages
  store/
    cart.ts               # Zustand cart (persisted)
middleware.ts             # locale detection + redirects (/ → /en-GB)
```

---

## Data flow (end-to-end)

1. **Request** hits `/[locale]` → **Server Component** `page.tsx`.
2. Server calls **internal API** `/api/products` (same origin).
3. The API **fetches upstream**, validates, and **normalises** to a stable `Product[]`.
4. The page **renders SSR** with products (no spinners).
5. Client hydrates. “More products” are fetched **client-side** through the same API.

**Why this shape?**

- Keeps upstream changes away from the UI.
- Avoids CORS issues.
- Gives us one place to cache, rate limit, and log.

---

## Types (key shapes)

```ts
// lib/api-client.ts
export interface Product {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  currency: 'GBP' | 'USD';
}
```

---

## Internal API (normalisation sketch)

```ts
// app/api/products/route.ts (excerpt)
type UpstreamProduct = {
  id: number;
  name?: { uk?: string; us?: string };
  price?: { gbp?: number; usd?: number };
  stock?: number;
};

// Convert upstream into a stable array our UI understands
function toTransformedProducts(data: { success?: boolean; products?: UpstreamProduct[] }, locale: 'uk' | 'us') {
  if (!data?.success || !Array.isArray(data.products)) return [];
  return data.products.map((p, i) => ({
    id: p.id ?? i,
    name: (locale === 'us' ? p.name?.us : p.name?.uk) || p.name?.uk || p.name?.us || `Product ${p.id}`,
    description: `Stock: ${p.stock ?? 0}`,
    price: (locale === 'us' ? p.price?.usd : p.price?.gbp) ?? p.price?.gbp ?? p.price?.usd ?? 0,
    currency: locale === 'us' ? 'USD' : 'GBP'
  }));
}
```

---

## Currency and localisation

```ts
// lib/currency.ts
export function formatCurrency(value: number, currency: 'GBP' | 'USD', locale?: string) {
  const formatLocale = locale || (currency === 'USD' ? 'en-US' : 'en-GB');
  return new Intl.NumberFormat(formatLocale, { style: 'currency', currency }).format(value);
}
```

- **UK (`/en-GB`)** → GBP, `en-GB` rules
- **US (`/en-US`)** → USD, `en-US` rules

---

## Locale routing and middleware

- Routes live under `/[locale]`.
- Root visits (e.g. `/`) are redirected to a best-guess locale.

```ts
// src/middleware.ts (excerpt)
const LOCALES = ['en-GB', 'en-US'];
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = LOCALES.some(l => pathname.startsWith(`/${l}`));
  if (hasLocale) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/en-GB${pathname}`; // simple default; header‑aware in code
  return NextResponse.redirect(url);
}
```

---

## Cart state (Zustand)

```ts
// src/store/cart.ts (excerpt)
export type CartItem = { name: string; quantity: number; price?: number; currency?: 'GBP' | 'USD' };
type CartState = {
  items: CartItem[];
  addItem: (name: string, price?: number, currency?: 'GBP' | 'USD') => void;
  getTotalUniqueItems: () => number;
  getTotalQuantity: () => number;
};
```

**Usage example:**

```tsx
const total = useCartStore(s => s.getTotalQuantity());
```

---

## Local development

```bash
npm install
npm run dev
# open http://localhost:3000  → redirected to /en-GB
```

Run tests and lint:

```bash
npm run test
npm run lint
```

### Tuning staged loading

- Adjust delay constants in `src/app/[locale]/HomeClient.tsx`:
  - `SKELETON_DELAY_MS` (show skeletons after a short delay to avoid flashing)
  - `OVERLAY_MIN_MS` (keep overlay visible a bit longer for smoothness)
- Update styles in `src/app/globals.css` (`.spinner-ring`, `.skeleton`, `.loading-overlay`).

---

## CI/CD

- **`.github/workflows/ci.yml`** – lint, test, and build on every push/PR (Node 20). Uses concurrency to cancel duplicate in-flight runs per ref.
- **`.github/workflows/deploy.yml`** – deploys to Production after a successful CI on `main` (Vercel prebuild + deploy). Publishes the Production URL to the environment.
- **`.github/workflows/preview.yml`** – deploys Preview after a successful CI on non‑`main` branches.
  - Requires `VERCEL_TOKEN`.

---

## Security and hardening (pragmatic list)

- Validate and **type‑guard** upstream responses in the API route.
- Add **rate limiting** on `/api/products` if exposed publicly.
- Log upstream **latency** and **cache hits** (JSON logs).
- Keep secrets in **`.env`**, not in the repo.

---

## Future plans (native‑app‑ready roadmap)

1) **UX polish & a11y**
- Keyboard nav and ARIA labels for all controls.
- Skeletons for incremental loads only (SSR remains spinner‑free).

2) **Pricing & tax**
- Service for promotions, rounding, ex‑VAT/inc‑VAT display.
- Subtotals, totals, and per‑line extended prices on checkout.

3) **Product details + deep linking**
- `/[locale]/product/[id]` as SSR page.
- Precompute OpenGraph/SEO.

4) **State boundary & analytics**
- Small application service wrapping cart mutations.
- Emit commerce events (`view_item`, `add_to_cart`, `begin_checkout`).

5) **Auth & server actions**
- “Sign in” and “Save cart” via server actions + session.
- Sync carts across devices when signed in.

6) **API hardening**
- Input validation, pagination contracts, stable error codes.
- Optional edge caching for list endpoints.

7) **Internationalisation at scale**
- Expand to more locales (`fr-FR`, `de-DE`, `ja-JP`).
- Keep message access stable; later plug a TMS (Crowdin/Locize) without rewrites.

8) **Native‑readiness**
- Keep APIs **JSON/HTTP**; mobile can reuse them.
- Share **design tokens** for web/native consistency.
- Consider **React Native + Expo** for a shared domain model.

---

## Contributing

- Keep PRs focused with clear commit messages.
- Keep components small; push transformations into **pure functions**.
- When adding locales, include **messages + currency mapping**.
- Prefer **server components** for data‑heavy views; keep client islands thin.

---

## Notes for reviewers

- Commits are grouped to tell a story (deps → cart → API → i18n → routing → cleanup → tests → CI/CD).
- Tests cover key flows: **empty basket**, **add to basket**, **quantity math**.
- The goal is a **boringly stable** base that can grow into a native app without a rewrite.

---

This codebase is intentionally small and readable. It shows how to deliver SSR product pages, a clean proxy API, a dependable cart, and simple i18n—while leaving clear seams for growth (pricing, auth, analytics, native).
