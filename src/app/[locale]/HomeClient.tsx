'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Product, api } from '@/lib/api-client';
import { useCartStore } from '@/store/cart';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import { useCartHydration } from '@/hooks/useCartHydration';

interface HomeClientProps {
  initialProducts: Product[];
  currency: 'GBP' | 'USD';
  locale: string;
}

export default function HomeClient({ initialProducts, currency, locale }: HomeClientProps) {
  const t = useTranslations();
  const { addItem, getQuantityFor, getTotalUniqueItems } = useCartStore();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSkeletons, setShowSkeletons] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  
  // Tunables
  const SKELETON_DELAY_MS = 450; // avoid flash
  const OVERLAY_MIN_MS = 1000; // keep overlay a little longer
  const hasHydrated = useCartHydration();

  useEffect(() => {
    let mounted = true;
    const apiLocale = currency === 'USD' ? 'us' : 'uk';
    
    setIsLoadingMore(true);
    api.getMoreProducts(apiLocale)
      .then(moreProducts => {
        if (mounted && moreProducts.length > 0) {
          setProducts(prevProducts => [...prevProducts, ...moreProducts]);
        }
      })
      .catch(() => {}) // Silently fail for additional products
      .finally(() => { if (mounted) setIsLoadingMore(false); });
    
    return () => { mounted = false; };
  }, [currency]);

  // Stage loading UI: show overlay immediately, skeletons after short delay
  useEffect(() => {
    let skeletonTimer: ReturnType<typeof setTimeout> | undefined;
    let overlayTimer: ReturnType<typeof setTimeout> | undefined;
    if (isLoadingMore) {
      setOverlayVisible(true);
      skeletonTimer = setTimeout(() => setShowSkeletons(true), SKELETON_DELAY_MS);
      overlayTimer = setTimeout(() => setOverlayVisible(false), OVERLAY_MIN_MS);
    } else {
      setShowSkeletons(false);
      setOverlayVisible(false);
    }
    return () => {
      if (skeletonTimer) clearTimeout(skeletonTimer);
      if (overlayTimer) clearTimeout(overlayTimer);
    };
  }, [isLoadingMore]);

  const handleAddToCart = useCallback((product: Product) => {
    addItem(product.name, product.price, currency);
  }, [addItem, currency]);

  const basketItemCount = hasHydrated ? getTotalUniqueItems() : 0;
  const basketLabel = useMemo(() => {
    const noun = basketItemCount === 1 ? t('item') : t('items');
    return `${t('basket')}: ${basketItemCount} ${noun}`;
  }, [t, basketItemCount]);

  return (
    <main className="page-layout">
      <header className="page-header">
        <p className="callout">{t('title')}</p>
        <Link href={`/${locale}/checkout`} aria-label={t('basket')}>
          <button className="btn" suppressHydrationWarning>
            {basketLabel}
          </button>
        </Link>
      </header>

      <div className="product-grid">
        {products.map((product) => (
          <button 
            key={product.id} 
            className="card group" 
            onClick={() => handleAddToCart(product)} 
            aria-label={t('addToBasket')}
          >
            <h2 className="mb-[0.7rem] font-semibold">{product.name} <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">-&gt;</span></h2>
            <p className="max-w-[30ch] text-[0.9rem] leading-6 opacity-60">{product.description ?? ''}</p>
            {typeof product.price === 'number' && (
              <p className="mt-2"><strong>{formatCurrency(product.price, currency, locale)}</strong></p>
            )}
          </button>
        ))}
        {overlayVisible && (
          <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
            <div className="spinner-ring" aria-hidden="true"></div>
            <span>Loading more…</span>
          </div>
        )}
        {showSkeletons && (
          <>
            <div className="skeleton" aria-hidden="true">
              <div className="skeleton-line w-2/3 mb-[var(--space-3)]"></div>
              <div className="skeleton-line w-full mb-[var(--space-2)]"></div>
              <div className="skeleton-line w-3/4"></div>
            </div>
            <div className="skeleton" aria-hidden="true">
              <div className="skeleton-line w-2/3 mb-[var(--space-3)]"></div>
              <div className="skeleton-line w-full mb-[var(--space-2)]"></div>
              <div className="skeleton-line w-3/4"></div>
            </div>
            <div className="skeleton" aria-hidden="true">
              <div className="skeleton-line w-2/3 mb-[var(--space-3)]"></div>
              <div className="skeleton-line w-full mb-[var(--space-2)]"></div>
              <div className="skeleton-line w-3/4"></div>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-[var(--space-8)] space-y-[var(--space-1)] text-sm opacity-80">
        {products.slice(0, 4).map(product => (
          <div key={`qty-${product.id}`} suppressHydrationWarning>
            {product.name} count: {hasHydrated ? getQuantityFor(product.name) : 0}
          </div>
        ))}
      </div>
    </main>
  );
}
