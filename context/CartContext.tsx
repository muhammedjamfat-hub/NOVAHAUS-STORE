"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { CartItem } from "@/lib/types";

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variationId: string | null) => void;
  updateQuantity: (productId: string, variationId: string | null, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "novahaus_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load cart", e);
    }
    setHydrated(true);
  }, []);

  // Persist cart whenever it changes (after initial hydration)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  function addItem(newItem: CartItem) {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === newItem.productId && i.variationId === newItem.variationId
      );
      if (existing) {
        const newQty = Math.min(existing.quantity + newItem.quantity, existing.maxStock);
        return prev.map((i) =>
          i.productId === newItem.productId && i.variationId === newItem.variationId
            ? { ...i, quantity: newQty }
            : i
        );
      }
      return [...prev, newItem];
    });
  }

  function removeItem(productId: string, variationId: string | null) {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variationId === variationId))
    );
  }

  function updateQuantity(productId: string, variationId: string | null, quantity: number) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId && i.variationId === variationId) {
          const clamped = Math.max(1, Math.min(quantity, i.maxStock));
          return { ...i, quantity: clamped };
        }
        return i;
      })
    );
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, subtotal, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
