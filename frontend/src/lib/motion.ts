import { useEffect, useState, useRef } from 'react';

/**
 * Sistem Gerak Tunggal CD'E Pearls (Tahap Q)
 * Durasi standar: 150ms (fast), 250ms (normal), 400ms (slow)
 * Easing seragam: cubic-bezier(0.16, 1, 0.3, 1)
 */

export const MOTION_DURATIONS = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

export const MOTION_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * Deteksi preferensi reduced motion pengguna
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  return prefersReduced;
}

/**
 * IntersectionObserver untuk scroll reveal (threshold: 0.1, sekali)
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.05
) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -20px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

/**
 * Stagger delay untuk daftar kartu produk (40ms per item, maks 8 item per batch)
 */
export function getStaggerDelay(index: number, max = 8, step = 40): number {
  return Math.min(index % max, max) * step;
}

