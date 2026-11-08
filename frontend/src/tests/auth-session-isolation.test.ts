import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { authApi, apiClient } from '../lib/api';
import { getCachedData, setCachedData, clearAllClientCache } from '../lib/clientCache';

describe('Tahap V2c: Multi-User Session Cache Invalidation (Isolation Between User A and B)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAllClientCache();
    vi.restoreAllMocks();
  });

  it('1. Login akun A, logout, lalu login akun B: auth/me dan cache dashboard harus milik B tanpa residu A', async () => {
    const userA = {
      id: 101,
      name: 'Pelanggan Alpha',
      email: 'alpha@cdepearlslombok.id',
      role: 'user',
    };

    const userB = {
      id: 202,
      name: 'Auditor Beta',
      email: 'beta@cdepearlslombok.id',
      role: 'spi',
    };

    // Mock axios.get for Sanctum CSRF cookie
    vi.spyOn(axios, 'get').mockResolvedValue({ status: 204, data: '' });

    // Mock apiClient responses
    const getSpy = vi.spyOn(apiClient, 'get');
    const postSpy = vi.spyOn(apiClient, 'post');

    // --- STEP 1: LOGIN USER A ---
    postSpy.mockResolvedValueOnce({
      status: 200,
      data: {
        success: true,
        message: 'Login berhasil',
        token: 'token-jwt-alpha-101',
        user: userA,
      },
    });

    const loginResA = await authApi.login({
      email: 'alpha@cdepearlslombok.id',
      password: 'StrongPassword123!',
    });
    expect(loginResA.user.name).toBe('Pelanggan Alpha');
    expect(localStorage.getItem('cde_auth_token')).toBe('token-jwt-alpha-101');

    // Mock GET /auth/me for User A
    getSpy.mockResolvedValueOnce({
      status: 200,
      data: { success: true, user: userA },
    });

    const meA = await authApi.getMe();
    expect(meA.id).toBe(101);
    expect(meA.email).toBe('alpha@cdepearlslombok.id');
    expect(getCachedData('auth:me:token-jwt-alpha-101')).toEqual(userA);

    // Simulate cached dashboard data for User A
    setCachedData('dashboard:orders:101', [{ id: 'ORD-A1', total: 15000000 }]);
    expect(getCachedData('dashboard:orders:101')).toHaveLength(1);

    // --- STEP 2: LOGOUT USER A ---
    postSpy.mockResolvedValueOnce({
      status: 200,
      data: { success: true, message: 'Logout berhasil' },
    });

    await authApi.logout();

    // Verify token removed and all cache wiped
    expect(localStorage.getItem('cde_auth_token')).toBeNull();
    expect(getCachedData('auth:me:token-jwt-alpha-101')).toBeNull();
    expect(getCachedData('dashboard:orders:101')).toBeNull();

    // --- STEP 3: LOGIN USER B ---
    postSpy.mockResolvedValueOnce({
      status: 200,
      data: {
        success: true,
        message: 'Login berhasil',
        token: 'token-jwt-beta-202',
        user: userB,
      },
    });

    const loginResB = await authApi.login({
      email: 'beta@cdepearlslombok.id',
      password: 'StrongPassword456!',
    });
    expect(loginResB.user.name).toBe('Auditor Beta');
    expect(localStorage.getItem('cde_auth_token')).toBe('token-jwt-beta-202');

    // Mock GET /auth/me for User B
    getSpy.mockResolvedValueOnce({
      status: 200,
      data: { success: true, user: userB },
    });

    const meB = await authApi.getMe();
    expect(meB.id).toBe(202);
    expect(meB.email).toBe('beta@cdepearlslombok.id');
    expect(meB.role).toBe('spi');

    // Assert that User A's data is completely absent from client cache
    expect(getCachedData('auth:me:token-jwt-alpha-101')).toBeNull();
    expect(getCachedData('dashboard:orders:101')).toBeNull();
    expect(getCachedData('auth:me:token-jwt-beta-202')).toEqual(userB);
  });
});
