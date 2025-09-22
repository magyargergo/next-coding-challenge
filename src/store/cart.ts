'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  name: string;
  quantity: number;
  price?: number;
  currency?: string;
};

interface CartActions {
  addItem: (itemName: string, price?: number, currency?: string) => void;
  decrementItem: (itemName: string) => void;
  removeItem: (itemName: string) => void;
  setQuantity: (itemName: string, quantity: number) => void;
  clear: () => void;
}

interface CartSelectors {
  getQuantityFor: (itemName: string) => number;
  getTotalUniqueItems: () => number;
  getTotalQuantity: () => number;
}

interface CartState extends CartActions, CartSelectors {
  items: CartItem[];
}

// Helper functions for cart operations
const updateItemQuantity = (items: CartItem[], itemName: string, newQuantity: number): CartItem[] => {
  const index = items.findIndex(item => item.name === itemName);
  if (index === -1) return items;
  
  const updated = [...items];
  if (newQuantity <= 0) {
    updated.splice(index, 1);
  } else {
    updated[index] = { ...updated[index], quantity: newQuantity };
  }
  return updated;
};

const addOrIncrementItem = (items: CartItem[], itemName: string, price?: number, currency?: string): CartItem[] => {
  const existingIndex = items.findIndex(item => item.name === itemName);
  
  if (existingIndex !== -1) {
    return updateItemQuantity(items, itemName, items[existingIndex].quantity + 1);
  }
  
  return [...items, { name: itemName, quantity: 1, price, currency }];
};

export const useCartStore = create<CartState>()(persist((set, get) => ({
  items: [],
  
  // Actions
  addItem: (itemName: string, price?: number, currency?: string) => {
    set(state => ({ items: addOrIncrementItem(state.items, itemName, price, currency) }));
  },
  
  decrementItem: (itemName: string) => {
    set(state => {
      const item = state.items.find(i => i.name === itemName);
      if (!item) return state;
      return { items: updateItemQuantity(state.items, itemName, item.quantity - 1) };
    });
  },
  
  removeItem: (itemName: string) => {
    set(state => ({ items: state.items.filter(item => item.name !== itemName) }));
  },
  
  setQuantity: (itemName: string, quantity: number) => {
    const validQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 0;
    set(state => ({ items: updateItemQuantity(state.items, itemName, validQuantity) }));
  },
  
  clear: () => set({ items: [] }),
  
  // Selectors
  getQuantityFor: (itemName: string) => {
    return get().items.find(item => item.name === itemName)?.quantity ?? 0;
  },
  
  getTotalUniqueItems: () => get().items.length,
  
  getTotalQuantity: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
}), { name: 'cart-store' }));


// Sync cart to a cookie so Server Components can read it via next/headers
if (typeof window !== 'undefined') {
  const writeCartCookie = (items: CartItem[]) => {
    try {
      const serializable = items.map(({ name, quantity, price, currency }) => ({ name, quantity, price, currency }));
      const value = encodeURIComponent(JSON.stringify(serializable));
      // 7 days, Lax same-site for safety
      document.cookie = `cart=${value}; path=/; max-age=604800; samesite=lax`;
    } catch {
      // noop
    }
  };

  // initial sync
  writeCartCookie(useCartStore.getState().items);
  // subscribe to items changes only
  (useCartStore as any).subscribe((state: CartState) => state.items, (items: CartItem[]) => {
    writeCartCookie(items);
  });
}

