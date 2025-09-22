'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import styles from '../page.module.css';
import { Product, api } from '@/lib/api-client';
import { useCartStore } from '@/store/cart';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';

export default function HomeClient({ initialProducts, currency, locale }: { 
  initialProducts: Product[]; 
  currency: 'GBP' | 'USD'; 
  locale: string; 
}) {
  const t = useTranslations();
  const addItem = useCartStore(s => s.addItem);
  const getQuantityFor = useCartStore(s => s.getQuantityFor);
  const totalUnique = useCartStore(s => s.getTotalUniqueItems());
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Ensure we only show derived counts after hydration to avoid SSR mismatch
    const persistApi: any = (useCartStore as any).persist;
    if (persistApi?.hasHydrated?.()) {
      setHasHydrated(true);
    }
    const unsub = persistApi?.onFinishHydration?.(() => setHasHydrated(true));

    let mounted = true;
    const apiLocale = currency === 'USD' ? 'us' : 'uk';
    api.getMoreProducts(apiLocale).then(more => {
      if (mounted && more.length) setProducts(prev => [...prev, ...more]);
    }).catch(() => {});
    return () => { mounted = false; unsub?.(); };
  }, [currency]);

  const onAdd = useCallback((p: Product) => {
    addItem(p.name, p.price, currency);
  }, [addItem, currency]);

  const shownCount = hasHydrated ? totalUnique : 0;
  const basketLabel = useMemo(() => {
    const noun = shownCount === 1 ? t('item') : t('items');
    return `${t('basket')}: ${shownCount} ${noun}`;
  }, [t, shownCount]);

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>{t('title')}</p>
        <div>
          <Link href={`/${locale}/checkout`} aria-label={t('basket')}>
            <button className={styles.basket} suppressHydrationWarning>{basketLabel}</button>
          </Link>
        </div>
      </div>

      <div className={styles.grid}>
        {products.map((p) => (
          <button key={p.id} className={styles.card} onClick={() => onAdd(p)} aria-label={t('addToBasket')}>
            <h2>{p.name} <span>-&gt;</span></h2>
            <p>{p.description ?? ''}</p>
            {typeof p.price === 'number' && (
              <p><strong>{formatCurrency(p.price, currency, locale)}</strong></p>
            )}
          </button>
        ))}
      </div>
      <div>
        {products.slice(0, 4).map(p => (
          <div key={`qty-${p.id}`}>{p.name} count: {hasHydrated ? getQuantityFor(p.name) : 0}</div>
        ))}
      </div>
    </main>
  );
}
