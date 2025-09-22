"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

type PriceInfo = {
  price: number;
  currency: 'GBP' | 'USD';
};

/**
 * Custom hook to fetch and manage localized product prices
 * Automatically updates when locale changes
 */
export function useLocalizedPrices(locale: string) {
  const [priceMap, setPriceMap] = useState<Record<string, PriceInfo>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    const loadPrices = async () => {
      try {
        const isUS = locale === 'en-US';
        const apiLocale = isUS ? 'us' : 'uk';
        const currency = isUS ? 'USD' : 'GBP';
        
        const [products, moreProducts] = await Promise.all([
          api.getProducts(apiLocale),
          api.getMoreProducts(apiLocale)
        ]);

        if (!mounted) return;

        const map: Record<string, PriceInfo> = {};
        [...products, ...moreProducts].forEach(product => {
          map[product.name] = { price: product.price, currency };
        });

        setPriceMap(map);
      } catch {
        if (mounted) setPriceMap({});
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadPrices();
    return () => { mounted = false; };
  }, [locale]);

  const getLocalizedPrice = (productName: string, fallbackPrice = 0) => {
    const info = priceMap[productName];
    const currency = locale === 'en-US' ? 'USD' : 'GBP';
    return {
      price: info?.price ?? fallbackPrice,
      currency: info?.currency ?? currency
    };
  };

  return { priceMap, isLoading, getLocalizedPrice };
}
