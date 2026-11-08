import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import React from 'react';
import { WishlistProvider, useWishlist } from '../context/WishlistContext';
import { CartProvider, useCart } from '../context/CartContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { wishlistApi, cartApi, authApi } from '../lib/api';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

interface TestConsumerProps {
  onCapture?: (methods: {
    auth: ReturnType<typeof useAuth>;
    wishlist: ReturnType<typeof useWishlist>;
    cart: ReturnType<typeof useCart>;
  }) => void;
}

function TestConsumer({ onCapture }: TestConsumerProps) {
  const auth = useAuth();
  const wishlist = useWishlist();
  const cart = useCart();

  React.useEffect(() => {
    onCapture?.({ auth, wishlist, cart });
  }, [auth, wishlist, cart, onCapture]);

  return (
    <div>
      <span data-testid="cart-count">{cart.totalItemsCount}</span>
      <span data-testid="wishlist-count">{wishlist.wishlistCount}</span>
    </div>
  );
}

describe('Tahap V3a: Investigasi & Perbaikan Favorit dan Keranjang Pembeli (Butir D)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  const sampleProduct = {
    id: 101,
    name: 'Kalung Mutiara Hitam Barok Tahitian',
    slug: 'kalung-mutiara-hitam-barok-101',
    price: 18500000,
    original_price: 20000000,
    stock: 3,
    category: 'Kalung',
    variety: 'Tahitian Pearl',
    grade: 'AAA',
    pearl_size: '13 mm',
    metal: 'Emas Putih 18K',
    image: '/storage/products/kalung-hitam.jpg',
  };

  it('1. Tamu klik favorit: dialihkan ke halaman login dengan return_to dan tersimpan di pending session', async () => {
    let captured: any = null;

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      pathname: '/katalog',
      search: '?kategori=kalung',
      href: '',
    } as any;

    await act(async () => {
      root.render(
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <TestConsumer onCapture={(m) => { captured = m; }} />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      );
    });

    await act(async () => {
      await captured.wishlist.toggleWishlist(sampleProduct);
    });

    // Cek sessionStorage pending favorit
    const pending = JSON.parse(sessionStorage.getItem('cde_pending_wishlist') || '{}');
    expect(pending.id).toBe(101);
    expect(pending.name).toBe('Kalung Mutiara Hitam Barok Tahitian');

    // Cek redirection target membawa return_to dan action=favorite
    expect(window.location.href).toContain('/masuk?return_to=');
    expect(window.location.href).toContain('action=favorite');
    expect(window.location.href).toContain('product_id=101');

    window.location = originalLocation;
  });

  it('2. Tamu belanja di keranjang lokal (localStorage): kuantitas tidak boleh melebihi stok yang ada', async () => {
    let captured: any = null;

    await act(async () => {
      root.render(
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <TestConsumer onCapture={(m) => { captured = m; }} />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      );
    });

    // Tambah 2 butir (stok = 3) -> Sukses
    let success1 = false;
    await act(async () => {
      success1 = await captured.cart.addToCart(sampleProduct, 2);
    });
    expect(success1).toBe(true);
    expect(captured.cart.items).toHaveLength(1);
    expect(captured.cart.items[0].quantity).toBe(2);

    // Tambah 2 butir lagi (total 4 > stok 3) -> Ditolak
    let success2 = true;
    await act(async () => {
      success2 = await captured.cart.addToCart(sampleProduct, 2);
    });
    expect(success2).toBe(false);
    expect(captured.cart.items[0].quantity).toBe(2); // tetap 2

    // Verifikasi tersimpan di localStorage keranjang lokal
    const savedLocal = JSON.parse(localStorage.getItem('cde_cart_v3') || '[]');
    expect(savedLocal).toHaveLength(1);
    expect(savedLocal[0].quantity).toBe(2);
  });

  it('3. Stepper keranjang: kuantitas tidak dapat dinaikkan melebihi batas stok pada data produk', async () => {
    let captured: any = null;

    await act(async () => {
      root.render(
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <TestConsumer onCapture={(m) => { captured = m; }} />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      );
    });

    await act(async () => {
      await captured.cart.addToCart(sampleProduct, 2);
    });

    // Naikkan kuantitas ke 3 (stok maksimum = 3) -> Sukses
    let updated = false;
    await act(async () => {
      updated = await captured.cart.updateQuantity(sampleProduct.id, 3);
    });
    expect(updated).toBe(true);
    expect(captured.cart.items[0].quantity).toBe(3);

    // Coba naikkan ke 4 (> stok 3) -> Ditolak
    let exceeded = true;
    await act(async () => {
      exceeded = await captured.cart.updateQuantity(sampleProduct.id, 4);
    });
    expect(exceeded).toBe(false);
    expect(captured.cart.items[0].quantity).toBe(3);
  });

  it('4. Saat login: keranjang tamu disinkronkan ke akun via API cartApi.syncCart', async () => {
    localStorage.setItem(
      'cde_cart_v3',
      JSON.stringify([
        {
          product: sampleProduct,
          quantity: 2,
        },
      ])
    );

    const syncSpy = vi.spyOn(cartApi, 'syncCart').mockResolvedValue({
      success: true,
      data: {
        id: 99,
        items: [
          {
            id: 1,
            product_id: 101,
            product_name: sampleProduct.name,
            product_image: sampleProduct.image,
            price: 18500000,
            original_price: 20000000,
            stock: 3,
            is_in_stock: true,
            quantity: 2,
            subtotal: 37000000,
          },
        ],
        total_items: 1,
        subtotal: 37000000,
      },
    });

    vi.spyOn(authApi, 'getMe').mockRejectedValueOnce(new Error('Unauthenticated'));

    vi.spyOn(wishlistApi, 'getWishlist').mockResolvedValue({
      success: true,
      data: [],
      total: 0,
    });

    vi.spyOn(authApi, 'login').mockResolvedValue({
      success: true,
      message: 'Login berhasil',
      token: 'token-authenticated-user',
      user: { id: 777, name: 'Siti Rahma', email: 'siti@cdepearlslombok.id', role: 'user' },
    });

    let captured: any = null;

    await act(async () => {
      root.render(
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <TestConsumer onCapture={(m) => { captured = m; }} />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      );
    });

    await act(async () => {
      await captured.auth.login({
        email: 'siti@cdepearlslombok.id',
        password: 'SecurePassword123!',
      });
    });

    expect(syncSpy).toHaveBeenCalledWith([
      { product_id: 101, quantity: 2, custom_specs: undefined },
    ]);
  });

  it('5. Pengguna login: klik hati melakukan pembaruan optimistik dan memanggil API toggle', async () => {
    vi.spyOn(wishlistApi, 'getWishlist').mockResolvedValue({
      success: true,
      data: [],
      total: 0,
    });

    const toggleSpy = vi.spyOn(wishlistApi, 'toggleWishlist').mockResolvedValue({
      success: true,
      in_wishlist: true,
      message: 'Produk ditambahkan ke Wishlist.',
    });

    vi.spyOn(authApi, 'login').mockResolvedValue({
      success: true,
      message: 'Login berhasil',
      token: 'token-authenticated-user',
      user: { id: 777, name: 'Siti Rahma', email: 'siti@cdepearlslombok.id', role: 'user' },
    });

    let captured: any = null;

    await act(async () => {
      root.render(
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <TestConsumer onCapture={(m) => { captured = m; }} />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      );
    });

    // Login
    await act(async () => {
      await captured.auth.login({
        email: 'siti@cdepearlslombok.id',
        password: 'SecurePassword123!',
      });
    });

    // Toggle favorite
    await act(async () => {
      await captured.wishlist.toggleWishlist(sampleProduct);
    });

    expect(toggleSpy).toHaveBeenCalledWith(101);
    expect(captured.wishlist.isInWishlist(101)).toBe(true);
  });

  it('6. Logout: membersihkan keranjang & favorit dari memori dan storage agar tidak bocor ke akun berikutnya', async () => {
    localStorage.setItem('cde_cart_v3', JSON.stringify([{ product: sampleProduct, quantity: 1 }]));
    localStorage.setItem('cde_wishlist_v3', JSON.stringify([sampleProduct]));
    localStorage.setItem('cde_coupon_v3', 'CDEVIP');
    sessionStorage.setItem('cde_pending_wishlist', JSON.stringify({ id: 101, name: 'Kalung' }));

    vi.spyOn(authApi, 'getMe').mockRejectedValueOnce(new Error('Unauthenticated'));
    vi.spyOn(wishlistApi, 'getWishlist').mockResolvedValue({ success: true, data: [sampleProduct], total: 1 });
    vi.spyOn(cartApi, 'syncCart').mockResolvedValue({
      success: true,
      data: { id: 1, items: [{ id: 1, product_id: 101, product_name: 'Kalung', price: 18500000, quantity: 1 }], total_items: 1, subtotal: 18500000 },
    });
    vi.spyOn(authApi, 'login').mockResolvedValue({
      success: true,
      message: 'Login berhasil',
      token: 'tok-user',
      user: { id: 777, name: 'Siti Rahma', email: 'siti@cdepearlslombok.id', role: 'user' },
    });
    vi.spyOn(authApi, 'logout').mockResolvedValue({ success: true, message: 'Logout berhasil' });

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    let captured: any = null;

    await act(async () => {
      root.render(
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <TestConsumer onCapture={(m) => { captured = m; }} />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      );
    });

    // 1. User login
    await act(async () => {
      await captured.auth.login({
        email: 'siti@cdepearlslombok.id',
        password: 'Password123!',
      });
    });

    // 2. User logout
    await act(async () => {
      await captured.auth.logout();
    });

    // Memory cleared
    expect(captured.cart.items).toHaveLength(0);
    expect(captured.wishlist.wishlist).toHaveLength(0);

    // Storage cleared
    expect(localStorage.getItem('cde_cart_v3')).toBeNull();
    expect(localStorage.getItem('cde_wishlist_v3')).toBeNull();
    expect(localStorage.getItem('cde_coupon_v3')).toBeNull();
    expect(sessionStorage.getItem('cde_pending_wishlist')).toBeNull();

    window.location = originalLocation;
  });
});
