import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

export type CartItem = { id: number; title: string; price: number; quantity: number; note?: string };

type CartCtx = {
  items: CartItem[];
  addItem: (it: CartItem) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartCtx>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clearCart: () => {},
});

function storageKey(userId: number | null) {
  return `cart:${userId ?? "guest"}`;
}

export const CartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { id: userId } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  // โหลดตะกร้าตาม user
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(userId));
      setItems(raw ? JSON.parse(raw) : []);
      localStorage.setItem("cart_owner", String(userId ?? "guest"));
    } catch {}
  }, [userId]);

  // บันทึกตาม user
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(items));
    } catch {}
  }, [items, userId]);

  const addItem = (it: CartItem) => {
    setItems(prev => {
      const found = prev.find(p => p.id === it.id);
      if (found) {
        return prev.map(p => (p.id === it.id ? { ...p, quantity: p.quantity + it.quantity } : p));
      }
      return [...prev, it];
    });
  };

  const removeItem = (id: number) => setItems(prev => prev.filter(p => p.id !== id));
  const updateQty = (id: number, qty: number) =>
    setItems(prev => prev.map(p => (p.id === id ? { ...p, quantity: Math.max(1, qty) } : p)));
  const clearCart = () => setItems([]);

  const value = useMemo(() => ({ items, addItem, removeItem, updateQty, clearCart }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
