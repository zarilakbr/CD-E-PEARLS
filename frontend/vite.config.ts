/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function htmlIndexingPlugin() {
  return {
    name: 'html-indexing-plugin',
    transformIndexHtml(html: string) {
      const allowIndexing = process.env.VITE_ALLOW_INDEXING !== 'false';
      if (!allowIndexing) {
        return html.replace(
          /<meta name="robots" content="index, follow"([^>]*)>/i,
          '<meta name="robots" content="noindex, nofollow"$1>'
        );
      }
      return html;
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  base: '/',
  plugins: [react(), tailwindcss(), htmlIndexingPlugin()],
  ssr: {
    noExternal: ['react-helmet-async'],
  },
  test: {
    include: ['src/tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sanctum': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: isSsrBuild
      ? {}
      : {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'vendor-react';
                }
                if (id.includes('@tanstack/react-query')) {
                  return 'vendor-query';
                }
                if (id.includes('lucide-react')) {
                  return 'vendor-icons';
                }
                if (id.includes('three')) {
                  return 'vendor-three';
                }
                if (id.includes('recharts')) {
                  return 'vendor-charts';
                }
                if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform/resolvers')) {
                  return 'vendor-forms';
                }
              }
            },
          },
        },
  },
}))
