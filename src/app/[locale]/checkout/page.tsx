'use client';

import { useCartStore } from '@/store/cart';
import Link from 'next/link';
import styles from '../../page.module.css';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function CheckoutPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale as string;
  const items = useCartStore(s => s.items);
  const totalQuantity = useCartStore(s => s.getTotalQuantity());

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>{t('checkout')}</p>
        <div>
          <Link href={`/${locale}`} className={styles.card}>&larr; {t('title')}</Link>
        </div>
      </div>

      <div className={styles.grid}>
        {items.length === 0 ? (
          <p>Empty</p>
        ) : (
          items.map(i => (
            <div key={i.name} className={styles.card}>
              <h2>{i.name}</h2>
              <p>Quantity: {i.quantity}</p>
            </div>
          ))
        )}
      </div>
      <div>
        <strong>{t('totalItems')}: {totalQuantity}</strong>
      </div>
    </main>
  );
}
