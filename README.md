# Michael's Next.js Coding Challenge

This repo demonstrates a production-grade implementation of an e‑commerce storefront using Next.js App Router. The original project arrived with TODOs, broken tests, and inefficient state. We’ve refactored it with clean architecture, strong typing, and a scalable i18n model.

## What’s inside
- SSR product listing (no spinners) with a clean API proxy layer
- Persisted cart using Zustand (selectors for totals and quantities)
- Locale‑aware routing: `/en-GB` (UK, GBP) and `/en-US` (US, USD)
- Post‑render “more products” fetch with graceful CORS handling
- Checkout page showing line items and total quantity
- CI: tests on every push; CD: deploy on push to `main`

## Tech decisions (short and sweet)
- App Router + server components for first paint product data
- Single internal API (`/api/products`) that proxies and normalizes upstream responses
- Currency formatting with `Intl.NumberFormat` and a thin utility to keep call sites clean
- `Zustand` for minimal, ergonomic, persisted cart state
- `next-intl` for messages, with a locale segment (`[locale]`) for scalability

## Local development
```bash
npm install
npm run dev
```

Open `http://localhost:3000` – the middleware will redirect you to a locale (e.g. `/en-GB`).

Run tests and linting:
```bash
npm run test
npm run lint
```

## How key pieces work
- Products load via SSR through `/api/products`, which fetches the upstream API and returns a normalized array. This guarantees “products on first paint” and avoids CORS.
- “More products” are fetched on the client, still through our internal API, so CORS and shaping remain consistent.
- The cart is fully client-side, persisted, and exposes selectors for derived values (total unique items, total quantity, per‑item quantity).
- Locale routing is handled by `[locale]` segments, and middleware redirects root traffic to a best‑effort locale. Content and currency are localized accordingly.

## CI/CD
- `.github/workflows/ci.yml`: run tests on every push/PR
- `.github/workflows/deploy.yml`: deploy to Vercel on push to `main` (configure `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets)

## Future plans (native‑app‑ready roadmap)

Incremental steps that keep the codebase “boringly stable” while moving toward a native app experience.

1) UX polish and accessibility
- Keyboard nav and screen reader labels for all interactive elements
- Semantic structure for product cards and totals
- Skeletons for “more products” (SSR remains spinner‑free)

2) Pricing and tax engine
- Centralize pricing rules (promotions, tax display, rounding) behind a service
- Surface a cart subtotal/total and per‑line extended price on checkout

3) Product details + deep linking
- Add `/[locale]/product/[id]` with SSR; share page config with native clients
- Precompute OpenGraph/SEO metadata per product

4) State boundary and analytics
- Introduce an application service layer for cart mutations (add, remove, set quantity) to enable analytics hooks
- Emit commerce events (view_item, add_to_cart, begin_checkout)

5) Auth and server actions
- Add `Sign in` and `Save cart` via server actions + session (edge‑ready)
- Allow signed‑in users to sync carts across devices (web/native)

6) API hardening
- Rate limiting and input validation on `/api/products`
- Observability: structured logs around upstream latency and cache hits

7) Internationalization at scale
- Move from two locales to a small registry (e.g., `en-GB`, `en-US`, `fr-FR`, `de-DE`, `ja-JP`)
- Externalize translations to a TMS later (Crowdin/Locize) without changing call sites

8) Native app readiness
- Keep all product and cart APIs JSON/HTTP compatible; the native app can reuse the same endpoints
- Co-locate design tokens (colors, spacing, typography) so web/native share a design language
- Consider React Native + Expo for a single shared domain model and analytics pipeline

## Contributing
- Prefer focused PRs with descriptive commit messages
- Keep components small and predictable; lean on pure functions for transformations
- When adding locales, include both messages and a currency mapping

## Notes for reviewers
- The commit history is intentionally grouped to tell a clear story (deps → cart → API → i18n → routing → cleanup → tests → CI/CD)
- Tests are minimal by design; they validate key user flows (empty basket, add to basket, quantity math)

---
This project started as a cleanup exercise and now demonstrates a pragmatic, scalable foundation for a global storefront that can evolve into a native app without a rewrite.
