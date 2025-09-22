"use client";

import { useCartStore } from '@/store/cart';
import Link from 'next/link';
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
    <main className="page-layout">
      <header className="page-header">
        <p className="callout">{t('checkout')}</p>
        <Link href={`/${locale}`} className="btn">
          &larr; {t('title')}
        </Link>
      </header>

      <div className="checkout-layout"> 
        <div className="grid gap-[var(--space-4)]">
          {renderContent()}
        </div>
        
        <aside className="summary-box md:sticky md:top-4"> 
          <h3 className="mb-3 text-lg font-semibold">{t('summary')}</h3>
          <div className="my-1 flex justify-between text-sm">
            <span>{t('totalItems')}</span>
            <span suppressHydrationWarning>{hasHydrated ? totalQuantity : 0}</span>
          </div>
          {hasHydrated && (
            <div className="mt-2 flex items-center justify-between text-base font-bold">
              <span>{t('grandTotal')}</span>
              <div className="font-semibold">
                {formatCurrency(grandTotal, locale === 'en-US' ? 'USD' : 'GBP', locale)}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
