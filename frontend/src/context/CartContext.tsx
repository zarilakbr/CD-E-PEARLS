import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { CartItem, Product } from '../types';
import { cartApi } from '../lib/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product | any, quantity?: number, customSpecs?: any) => Promise<boolean>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<void>;
  couponCode: string;
  discountPercent: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  insuranceCost: number;
  total: number;
  totalItemsCount: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cde_cart_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const [couponCode, setCouponCode] = useState<string>(() => {
    try {
      return localStorage.getItem('cde_coupon_v3') || '';
    } catch {
      return '';
    }
  });

  const [discountPercent, setDiscountPercent] = useState<number>(() => {
    try {
      const code = localStorage.getItem('cde_coupon_v3');
      if (code === 'CDEVIP') return 15;
      if (code === 'LOMBOK10') return 10;
      return 0;
    } catch {
      return 0;
    }
  });

  // Save guest items locally (only when guest and not transitioning from logout)
  useEffect(() => {
    if (!user) {
      if (prevUserRef.current) {
        setItems([]);
        try {
          localStorage.removeItem('cde_cart_v3');
        } catch { }
        return;
      }
      try {
        if (items.length > 0) {
          localStorage.setItem('cde_cart_v3', JSON.stringify(items));
        } else {
          localStorage.removeItem('cde_cart_v3');
        }
      } catch { }
    }
  }, [items, user]);

  useEffect(() => {
    try {
      if (couponCode) {
        localStorage.setItem('cde_coupon_v3', couponCode);
      } else {
        localStorage.removeItem('cde_coupon_v3');
      }
    } catch { }
  }, [couponCode]);

  // Transform backend CartItem into standard frontend CartItem
  const mapBackendItems = (backendItems: any[]): CartItem[] => {
    return backendItems.map((bItem: any) => ({
      id: bItem.id, // backend CartItem id
      quantity: bItem.quantity,
      customSpecs: bItem.custom_specs,
      product: {
        id: bItem.product_id,
        name: bItem.product_name,
        slug: bItem.product_slug || `product-${bItem.product_id}`,
        price: Number(bItem.price) || 0,
        originalPrice: Number(bItem.original_price) || Number(bItem.price) || 0,
        stock: Number(bItem.stock) ?? 999,
        image: bItem.product_image || '',
        webp_url: bItem.webp_url,
        category: bItem.category?.name || 'Mutiara South Sea',
        variety: bItem.variety || 'South Sea Pearl',
        grade: bItem.grade || 'AAA',
        pearlSize: bItem.pearl_size || '12 mm',
        metal: bItem.metal || 'Emas 18K',
        description: '',
        featured: false,
        isNew: false,
        rating: 5,
        reviewCount: 1,
      } as Product,
    }));
  };

  const refreshCart = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await cartApi.getCart();
      const rawItems = res?.data?.items || [];
      setItems(mapBackendItems(rawItems));
    } catch (err: any) {
      if (err?.response?.status === 429) {
        toast.error('Terlalu banyak permintaan keranjang. Mohon tunggu beberapa saat.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const prevUserRef = React.useRef<any>(user);

  // On user change: sync guest cart into database or clear on logout
  useEffect(() => {
    const wasLoggedIn = Boolean(prevUserRef.current);
    const isLoggedIn = Boolean(user);
    prevUserRef.current = user;

    if (isLoggedIn) {
      let localItems: CartItem[] = items;
      if (localItems.length === 0) {
        try {
          const saved = localStorage.getItem('cde_cart_v3');
          if (saved) localItems = JSON.parse(saved);
        } catch { }
      }

      if (localItems.length > 0) {
        // Sync local items to server
        const payload = localItems.map((it) => ({
          product_id: it.product.id,
          quantity: it.quantity,
          custom_specs: it.customSpecs,
        }));
        cartApi.syncCart(payload)
          .then((res) => {
            const synced = res?.data?.items || [];
            setItems(mapBackendItems(synced));
            try {
              localStorage.removeItem('cde_cart_v3');
            } catch { }
            toast.success('✓ Keranjang belanja Anda berhasil disinkronkan dengan akun.');
          })
          .catch(() => {
            refreshCart();
          });
      } else {
        refreshCart();
      }
    } else if (wasLoggedIn && !isLoggedIn) {
      // User transitioned from logged in to logged out: wipe memory & cache
      setItems([]);
      setCouponCode('');
      setDiscountPercent(0);
      try {
        localStorage.removeItem('cde_cart_v3');
        localStorage.removeItem('cde_coupon_v3');
      } catch { }
    }
  }, [user, refreshCart]);

  const addToCart = async (product: Product | any, quantity = 1, customSpecs?: any): Promise<boolean> => {
    const productId = Number(product?.id);
    if (!productId) return false;

    const availableStock = product.stock !== undefined ? Number(product.stock) : 999;
    if (availableStock <= 0) {
      toast.error(`Maaf, stok perhiasan ${product.name || 'ini'} sedang habis.`);
      return false;
    }

    if (quantity > availableStock) {
      toast.error(`Jumlah melebihi stok yang tersedia (tersisa ${availableStock} butir).`);
      return false;
    }

    const existing = items.find((i) => i.product.id === productId);
    const currentQty = existing ? existing.quantity : 0;
    if (currentQty + quantity > availableStock) {
      toast.error(`Total jumlah di keranjang melebihi stok yang tersedia (${availableStock} butir).`);
      return false;
    }

    if (!user) {
      // Guest cart (local)
      setItems((prev) => {
        const exist = prev.find((i) => i.product.id === productId);
        if (exist) {
          return prev.map((i) =>
            i.product.id === productId ? { ...i, quantity: i.quantity + quantity } : i
          );
        }
        return [...prev, { product, quantity, customSpecs }];
      });
      toast.success(`✓ ${product.name || 'Perhiasan'} ditambahkan ke keranjang belanja.`);
      return true;
    }

    // Authenticated cart (API)
    setIsLoading(true);
    try {
      await cartApi.addItem(productId, quantity, customSpecs);
      await refreshCart();
      toast.success(`✓ ${product.name || 'Perhiasan'} ditambahkan ke keranjang belanja.`);
      return true;
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 422) {
        toast.error(msg || `Stok produk ${product.name} tidak mencukupi.`);
      } else if (status === 429) {
        toast.error('Terlalu banyak permintaan. Mohon tunggu beberapa saat.');
      } else if (status === 401) {
        toast.error('Sesi Anda telah berakhir. Silakan masuk kembali.');
      } else {
        toast.error('Gagal menambahkan ke keranjang belanja. Periksa koneksi internet Anda.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: number, quantity: number): Promise<boolean> => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return true;
    }

    const currentItem = items.find((i) => i.product.id === productId);
    const availableStock = currentItem?.product.stock !== undefined ? Number(currentItem.product.stock) : 999;

    if (quantity > availableStock) {
      toast.error(`Jumlah perhiasan melebihi stok yang tersedia (tersisa ${availableStock} butir).`);
      return false;
    }

    if (!user) {
      setItems((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
      );
      return true;
    }

    // Authenticated cart
    const previousItems = [...items];
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );

    const backendItemId = currentItem?.id || productId;
    try {
      await cartApi.updateItem(backendItemId, quantity);
      return true;
    } catch (err: any) {
      setItems(previousItems);
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 422) {
        toast.error(msg || 'Jumlah melebihi stok yang tersedia.');
      } else if (status === 429) {
        toast.error('Terlalu banyak permintaan. Mohon tunggu beberapa saat.');
      } else {
        toast.error('Gagal memperbarui jumlah produk di keranjang.');
      }
      return false;
    }
  };

  const removeFromCart = async (productId: number): Promise<void> => {
    const currentItem = items.find((i) => i.product.id === productId);
    setItems((prev) => prev.filter((i) => i.product.id !== productId));

    if (user && currentItem?.id) {
      try {
        await cartApi.removeItem(currentItem.id);
        toast.info('Item dihapus dari keranjang belanja.');
      } catch (err: any) {
        if (err.response?.status === 429) {
          toast.error('Terlalu banyak permintaan. Mohon tunggu beberapa saat.');
        }
      }
    } else {
      toast.info('Item dihapus dari keranjang belanja.');
    }
  };

  const clearCart = async (): Promise<void> => {
    setItems([]);
    try {
      localStorage.removeItem('cde_cart_v3');
    } catch { }

    if (user) {
      try {
        await cartApi.clearCart();
      } catch { }
    }
  };

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'CDEVIP') {
      setCouponCode('CDEVIP');
      setDiscountPercent(15);
      toast.success('Kupon CDEVIP berhasil diterapkan: Diskon 15%');
      return { success: true, message: 'Diskon 15% VIP berhasil diterapkan.' };
    }
    if (clean === 'LOMBOK10') {
      setCouponCode('LOMBOK10');
      setDiscountPercent(10);
      toast.success('Kupon LOMBOK10 berhasil diterapkan: Diskon 10%');
      return { success: true, message: 'Diskon 10% berhasil diterapkan.' };
    }
    return { success: false, message: 'Kode kupon tidak valid atau telah kedaluwarsa.' };
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscountPercent(0);
    try {
      localStorage.removeItem('cde_coupon_v3');
    } catch { }
    toast.info('Kupon diskon telah dihapus.');
  };

  // Calculations verified strictly from numeric prices
  const subtotal = items.reduce((acc, item) => acc + (Number(item.product.price) || 0) * item.quantity, 0);
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
        isLoading,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    return {
      items: [],
      addToCart: async () => false,
      removeFromCart: async () => {},
      updateQuantity: async () => false,
      clearCart: async () => {},
      couponCode: '',
      discountPercent: 0,
      applyCoupon: () => ({ success: false, message: '' }),
      removeCoupon: () => {},
      subtotal: 0,
      discountAmount: 0,
      insuranceCost: 0,
      total: 0,
      totalItemsCount: 0,
      isLoading: false,
      refreshCart: async () => {},
    };
  }
  return context;
};
