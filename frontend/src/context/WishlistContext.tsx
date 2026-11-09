import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Product } from '../types';
import { wishlistApi } from '../lib/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product | any) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  wishlistCount: number;
  isLoading: boolean;
  refreshWishlist: () => Promise<void>;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('cde_wishlist_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync to localStorage as local cache
  useEffect(() => {
    if (user && wishlist.length > 0) {
      try {
        localStorage.setItem('cde_wishlist_v3', JSON.stringify(wishlist));
      } catch { }
    } else {
      try {
        localStorage.removeItem('cde_wishlist_v3');
      } catch { }
    }
  }, [wishlist, user]);

  const refreshWishlist = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await wishlistApi.getWishlist();
      const items = res.data || [];
      setWishlist(items);
      try {
        localStorage.setItem('cde_wishlist_v3', JSON.stringify(items));
      } catch { }
    } catch (err: any) {
      // 401/429/network silent fallback to local cache
      if (err?.response?.status === 429) {
        toast.error('Terlalu banyak permintaan sinkronisasi favorit. Mohon tunggu beberapa saat.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const prevUserRef = React.useRef<any>(user);

  // Load wishlist on user change and process any pending guest favorite
  useEffect(() => {
    const wasLoggedIn = Boolean(prevUserRef.current);
    const isLoggedIn = Boolean(user);
    prevUserRef.current = user;

    if (isLoggedIn) {
      refreshWishlist().then(async () => {
        // Check for pending wishlist item saved before login redirection
        try {
          const pendingRaw = sessionStorage.getItem('cde_pending_wishlist');
          if (pendingRaw) {
            sessionStorage.removeItem('cde_pending_wishlist');
            const pending = JSON.parse(pendingRaw);
            if (pending?.id) {
              await wishlistApi.toggleWishlist(pending.id);
              toast.success(`✓ Perhiasan ${pending.name || ''} berhasil ditambahkan ke koleksi favorit Anda.`);
              refreshWishlist();
            }
          }
        } catch { }
      });
    } else if (wasLoggedIn && !isLoggedIn) {
      // User transitioned from logged in to logged out: clear memory & local cache to prevent leakage
      setWishlist([]);
      try {
        localStorage.removeItem('cde_wishlist_v3');
        sessionStorage.removeItem('cde_pending_wishlist');
      } catch { }
    }
  }, [user, refreshWishlist]);

  const toggleWishlist = async (product: Product | any) => {
    const productId = Number(product?.id);
    if (!productId) return;

    // Guest user flow: redirect to login with return_to and save pending item
    if (!user) {
      try {
        sessionStorage.setItem(
          'cde_pending_wishlist',
          JSON.stringify({ id: productId, name: product.name || 'Perhiasan Mutiara' })
        );
      } catch { }

      toast.info('Silakan masuk ke akun Anda untuk menyimpan perhiasan favorit.');

      const currentPath = typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : '/katalog';
      const returnTo = encodeURIComponent(currentPath);

      if (typeof window !== 'undefined') {
        window.location.href = `/masuk?return_to=${returnTo}&action=favorite&product_id=${productId}`;
      }
      return;
    }

    // Authenticated user flow: Optimistic update
    const wasInWishlist = wishlist.some((p) => p.id === productId);
    const previousWishlist = [...wishlist];

    if (wasInWishlist) {
      setWishlist((prev) => prev.filter((p) => p.id !== productId));
    } else {
      setWishlist((prev) => [...prev, product]);
    }

    try {
      const res = await wishlistApi.toggleWishlist(productId);
      if (res?.in_wishlist) {
        toast.success(`✓ ${product.name || 'Produk'} ditambahkan ke koleksi favorit.`);
      } else {
        toast.info(`${product.name || 'Produk'} dihapus dari favorit.`);
      }
    } catch (err: any) {
      // Revert optimistic state on error
      setWishlist(previousWishlist);
      const status = err.response?.status;
      if (status === 401) {
        toast.error('Sesi Anda telah berakhir. Silakan masuk kembali.');
      } else if (status === 422) {
        toast.error(err.response?.data?.message || 'Data produk tidak valid.');
      } else if (status === 429) {
        toast.error('Terlalu banyak permintaan. Mohon tunggu beberapa saat.');
      } else {
        toast.error('Gagal memperbarui koleksi favorit. Periksa koneksi internet Anda.');
      }
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some((p) => p.id === productId);
  };

  const clearWishlist = () => {
    setWishlist([]);
    try {
      localStorage.removeItem('cde_wishlist_v3');
    } catch { }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlist.length,
        isLoading,
        refreshWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    return {
      wishlist: [],
      toggleWishlist: async () => {},
      isInWishlist: () => false,
      wishlistCount: 0,
      isLoading: false,
      refreshWishlist: async () => {},
      clearWishlist: () => {},
    };
  }
  return context;
};
