"use client";

import { useCallback } from 'react';
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
    <div className="summary-box flex flex-col gap-2">
      <h2 className="text-base font-semibold">{name}</h2>
      
      <div className="mt-[var(--space-2)] flex items-center gap-[var(--space-2)]">
        <button 
          onClick={() => decrementItem(name)} 
          aria-label={`${t('decrease')} ${name}`}
          className="btn-icon"
        >
          -
        </button>
        <label className="flex items-center gap-[var(--space-2)] text-sm">
          <span className="sr-only">{t('qty')}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="input w-16"
          />
        </label>
        <button 
          onClick={handleIncrement} 
          aria-label={`${t('increase')} ${name}`}
          className="btn-icon"
        >
          +
        </button>
      </div>

      <div className="mt-[var(--space-2)] flex gap-[var(--space-4)] text-[0.9rem] opacity-80">
        <span>{t('price')}: {formatCurrency(price, currency, locale)}</span>
        <span><strong>{t('subtotal')}: {formatCurrency(subtotal, currency, locale)}</strong></span>
      </div>

      <div className="mt-[var(--space-2)]">
        <button 
          onClick={() => removeItem(name)} 
          aria-label={`${t('remove')} ${name}`}
          className="btn-danger"
        >
          {t('remove')}
        </button>
      </div>
    </div>
  );
}


