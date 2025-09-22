"use client";

import { useCallback } from 'react';
import styles from '../../page.module.css';
import { formatCurrency } from '@/lib/currency';
import { useCartStore } from '@/store/cart';
import { useTranslations } from 'next-intl';

interface CartItemProps {
  name: string;
  price: number;
  currency: 'GBP' | 'USD';
  quantity: number;
  locale: string;
}

export default function CartItem({ name, price, currency, quantity, locale }: CartItemProps) {
  const t = useTranslations();
  const { addItem, decrementItem, removeItem, setQuantity } = useCartStore();

  const handleQuantityChange = useCallback((value: string) => {
    const num = Math.floor(Number(value));
    if (Number.isFinite(num)) {
      setQuantity(name, num);
    }
  }, [name, setQuantity]);

  const handleIncrement = useCallback(() => {
    addItem(name, price, currency);
  }, [addItem, name, price, currency]);

  const subtotal = price * quantity;

  return (
    <div className={`${styles.card} ${styles.itemCard}`}>
      <h2>{name}</h2>
      
      <div className={styles.controls}>
        <button 
          onClick={() => decrementItem(name)} 
          aria-label={`${t('decrease')} ${name}`}
        >
          -
        </button>
        <label className={styles.controls}>
          <span>{t('qty')}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className={styles.qtyInput}
          />
        </label>
        <button 
          onClick={handleIncrement} 
          aria-label={`${t('increase')} ${name}`}
        >
          +
        </button>
      </div>

      <div className={styles.priceRow}>
        <span>{t('price')}: {formatCurrency(price, currency, locale)}</span>
        <span><strong>{t('subtotal')}: {formatCurrency(subtotal, currency, locale)}</strong></span>
      </div>

      <div>
        <button 
          onClick={() => removeItem(name)} 
          aria-label={`${t('remove')} ${name}`}
        >
          {t('remove')}
        </button>
      </div>
    </div>
  );
}


