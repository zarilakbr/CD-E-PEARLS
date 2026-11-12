import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './lib/i18n';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { queryClient } from './lib/queryClient';
import { normalizePath } from './lib/seo';

const rootEl = document.getElementById('root')!;
const appTree = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);

const prerenderedPath = rootEl.getAttribute('data-prerendered-path');
const currentPath = normalizePath(window.location.pathname);

if (prerenderedPath && normalizePath(prerenderedPath) === currentPath && rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, appTree);
} else {
  if (rootEl.hasChildNodes()) {
    rootEl.innerHTML = '';
  }
  createRoot(rootEl).render(appTree);
}
