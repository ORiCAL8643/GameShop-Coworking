import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: number;        // game id
  title: string;
  price: number;     // snapshot per unit
  quantity: number;
  note?: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (it: CartItem) => void;
  updateQty: (id: number, qty: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  updateQty: () => {},
  removeItem: () => {},
  clearCart: () => {},
});

const LS_KEY = "cart";

export const CartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (it: CartItem) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === it.id);
      if (found) {
        return prev.map((p) => (p.id === it.id ? { ...p, quantity: p.quantity + it.quantity } : p));
      }
      return [...prev, it];
    });
  };

  const updateQty = (id: number, qty: number) =>
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, qty) } : p)));

  const removeItem = (id: number) => setItems((prev) => prev.filter((p) => p.id !== id));
  const clearCart = () => setItems([]);

  const api = useMemo(() => ({ items, addItem, updateQty, removeItem, clearCart }), [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
