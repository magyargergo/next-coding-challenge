"use client";

import { useCartStore } from '@/store/cart';
import Link from 'next/link';
import styles from '../../page.module.css';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import CartItem from './CartItem';
import { useCartHydration } from '@/hooks/useCartHydration';
import { useLocalizedPrices } from '@/hooks/useLocalizedPrices';
import { useMemo } from 'react';

export default function CheckoutPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale as string;
  
  const items = useCartStore(s => s.items);
  const totalQuantity = useCartStore(s => s.getTotalQuantity());
  
  const hasHydrated = useCartHydration();
  const { getLocalizedPrice } = useLocalizedPrices(locale);

  const { localizedItems, grandTotal } = useMemo(() => {
    const currency = locale === 'en-US' ? 'USD' : 'GBP' as const;
    
    const localizedItems = items.map(item => {
      const { price, currency: itemCurrency } = getLocalizedPrice(item.name, item.price ?? 0);
      return { ...item, price, currency: itemCurrency };
    });

    const grandTotal = localizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return { localizedItems, grandTotal };
  }, [items, getLocalizedPrice, locale]);

  const renderContent = () => {
    if (!hasHydrated) return <p>{t('loadingBasket')}</p>;
    if (items.length === 0) return <p>{t('empty')}</p>;
    
    return localizedItems.map(item => (
      <CartItem
        key={item.name}
        name={item.name}
        price={item.price}
        currency={item.currency}
        quantity={item.quantity}
        locale={locale}
      />
    ));
  };

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>{t('checkout')}</p>
        <div>
          <Link href={`/${locale}`} className={styles.card}>
            &larr; {t('title')}
          </Link>
        </div>
      </div>

      <div className={styles.checkoutContent}>
        <div className={styles.checkoutItems}>
          {renderContent()}
        </div>
        
        <aside className={`${styles.card} ${styles.checkoutSummary}`}>
          <h3>{t('summary')}</h3>
          <div className={styles.summaryRow}>
            <span>{t('totalItems')}</span>
            <span suppressHydrationWarning>{hasHydrated ? totalQuantity : 0}</span>
          </div>
          {hasHydrated && (
            <div className={styles.summaryTotal}>
              <span>{t('grandTotal')}</span>
              <div>
                {formatCurrency(grandTotal, locale === 'en-US' ? 'USD' : 'GBP', locale)}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
