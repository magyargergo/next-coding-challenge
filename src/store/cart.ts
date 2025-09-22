'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  name: string;
  quantity: number;
  price?: number;
  currency?: string;
};

type CartState = {
  items: CartItem[];
  addItem: (itemName: string, price?: number, currency?: string) => void;
  clear: () => void;
  getQuantityFor: (itemName: string) => number;
  getTotalUniqueItems: () => number;
  getTotalQuantity: () => number;
};

export const useCartStore = create<CartState>()(persist((set, get) => ({
  items: [],
  addItem: (itemName: string, price?: number, currency?: string) => {
    set(prev => {
      const existingIndex = prev.items.findIndex(i => i.name === itemName);
      if (existingIndex !== -1) {
        const updated = [...prev.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return { items: updated };
      }
      return {
        items: [...prev.items, { name: itemName, quantity: 1, price, currency }],
      };
    });
  },
  clear: () => set({ items: [] }),
  getQuantityFor: (itemName: string) => get().items.find(i => i.name === itemName)?.quantity || 0,
  getTotalUniqueItems: () => get().items.length,
  getTotalQuantity: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}), { name: 'cart-store' }));


