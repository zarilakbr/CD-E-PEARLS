import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './lib/i18n';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './App';
import { PRERENDER_ROUTES } from './lib/seo';

export interface PrerenderResult {
  route: string;
  appHtml: string;
  headTags: string;
}

export function getPrerenderRoutes(): readonly string[] {
  return PRERENDER_ROUTES;
}

/**
 * Splits React 19 hoisted document-metadata tags (<title>, <meta>, <link>)
 * from the rendered root HTML stream so prerender.mjs can place them in <head>
 * while preserving Suspense markers (<!--$-->) inside #root for hydrateRoot().
 */
function extractReact19HoistedHead(rawHtml: string): { headTags: string; bodyHtml: string } {
  const headParts: string[] = [];
  let cursor = 0;

  // Match leading <link .../>, <meta .../>, or <title>...</title> hoisted by React 19
  const leadingHeadRe =
    /^(?:\s*(?:<title>[\s\S]*?<\/title>|<(?:meta|link)\b[^>]*\/?>))+/i;
  const match = rawHtml.match(leadingHeadRe);
  if (match) {
    const hoistedChunk = match[0];
    cursor = hoistedChunk.length;

    const tagRe = /<title>[\s\S]*?<\/title>|<(?:meta|link)\b[^>]*\/?>/gi;
    let tagMatch: RegExpExecArray | null;
    while ((tagMatch = tagRe.exec(hoistedChunk)) !== null) {
      headParts.push(tagMatch[0]);
    }
  }

  return {
    headTags: headParts.join('\n    '),
    bodyHtml: rawHtml.slice(cursor),
  };
}

export function renderRoute(url: string): PrerenderResult {
  const ssrQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 60_000,
      },
    },
  });

  const rawHtml = renderToString(
    <StrictMode>
      <QueryClientProvider client={ssrQueryClient}>
        <ThemeProvider>
          <StaticRouter location={url}>
            <AppShell />
          </StaticRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>,
  );

  const { headTags, bodyHtml } = extractReact19HoistedHead(rawHtml);

  return {
    route: url,
    appHtml: bodyHtml,
    headTags,
  };
}
