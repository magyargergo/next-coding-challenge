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
  const hasHydrated = useCartHydration();

  useEffect(() => {
    let mounted = true;
    const apiLocale = currency === 'USD' ? 'us' : 'uk';
    
    api.getMoreProducts(apiLocale)
      .then(moreProducts => {
        if (mounted && moreProducts.length > 0) {
          setProducts(prevProducts => [...prevProducts, ...moreProducts]);
        }
      })
      .catch(() => {}); // Silently fail for additional products
    
    return () => { mounted = false; };
  }, [currency]);

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
