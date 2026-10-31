import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, customSpecs?: any) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  couponCode: string;
  discountPercent: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  insuranceCost: number;
  total: number;
  totalItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cde_cart_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [couponCode, setCouponCode] = useState<string>(() => {
    return localStorage.getItem('cde_coupon_v3') || '';
  });

  const [discountPercent, setDiscountPercent] = useState<number>(() => {
    const code = localStorage.getItem('cde_coupon_v3');
    if (code === 'CDEVIP') return 15;
    if (code === 'LOMBOK10') return 10;
    return 0;
  });

  useEffect(() => {
    localStorage.setItem('cde_cart_v3', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('cde_coupon_v3', couponCode);
  }, [couponCode]);

  const addToCart = (product: Product, quantity = 1, customSpecs?: any) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity, customSpecs }];
    });
  };

  const removeFromCart = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'LOMBOK10') {
      setCouponCode('LOMBOK10');
      setDiscountPercent(10);
      return { success: true, message: 'Kupon LOMBOK10 aktif! Diskon 10% berhasil diterapkan.' };
    }
    if (clean === 'CDEVIP') {
      setCouponCode('CDEVIP');
      setDiscountPercent(15);
      return { success: true, message: 'Kupon CDEVIP aktif! Diskon VIP 15% berhasil diterapkan.' };
    }
    return { success: false, message: 'Kode kupon tidak valid. Coba LOMBOK10 atau CDEVIP.' };
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscountPercent(0);
  };

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const insuranceCost = subtotal > 0 ? Math.round(subtotal * 0.002) : 0;
  const total = Math.max(0, subtotal - discountAmount + insuranceCost);
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        couponCode,
        discountPercent,
        applyCoupon,
        removeCoupon,
        subtotal,
        discountAmount,
        insuranceCost,
        total,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
