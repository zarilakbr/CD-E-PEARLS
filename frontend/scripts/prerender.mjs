import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const ssrOutDir = path.join(rootDir, 'dist-ssr');
const ssrEntryPath = path.join(ssrOutDir, 'entry-prerender.js');
const templatePath = path.join(distDir, 'index.html');
const spaFallbackPath = path.join(distDir, '_spa.html');

if (!fs.existsSync(templatePath)) {
  throw new Error(`[prerender] Missing client build template at ${templatePath}`);
}
if (!fs.existsSync(ssrEntryPath)) {
  throw new Error(`[prerender] Missing SSR entry bundle at ${ssrEntryPath}`);
}

const templateHtml = fs.readFileSync(templatePath, 'utf8');

// Preserve the clean SPA shell BEFORE writing prerendered HTML to dist/index.html.
// Cloudflare Worker serves /_spa.html for /produk/:id, /admin, /spi, /akun, etc.
fs.writeFileSync(spaFallbackPath, templateHtml);
console.log('[prerender] Saved clean SPA shell to dist/_spa.html');

const { getPrerenderRoutes, renderRoute } = await import(pathToFileURL(ssrEntryPath).href);
const routes = getPrerenderRoutes();

function injectPrerenderedPage(baseHtml, route, appHtml, headTags) {
  let html = baseHtml;

  // Strip base placeholders that Helmet/React 19 outputs cleanly so <head> has no duplicate SEO tags
  html = html.replace(/<title>[\s\S]*?<\/title>\s*/i, '');
  html = html.replace(/<meta\s+name="description"[^>]*>\s*/i, '');
  html = html.replace(/<meta\s+name="robots"[^>]*>\s*/i, '');

  if (headTags) {
    html = html.replace('</head>', `    ${headTags}\n  </head>`);
  }

  if (!html.includes('<div id="root"></div>')) {
    throw new Error('[prerender] Could not locate <div id="root"></div> placeholder in dist/index.html');
  }

  html = html.replace(
    '<div id="root"></div>',
    `<div id="root" data-prerendered-path="${route}">${appHtml}</div>`,
  );

  return html;
}

for (const route of routes) {
  const { appHtml, headTags } = renderRoute(route);
  if (!appHtml || appHtml.length < 200) {
    throw new Error(`[prerender] Route ${route} rendered unexpectedly empty HTML (${appHtml?.length || 0} chars)`);
  }
  if (!headTags || !headTags.includes('<title>')) {
    throw new Error(`[prerender] Route ${route} is missing <title> metadata in headTags`);
  }
  if (!headTags.includes('rel="canonical"')) {
    throw new Error(`[prerender] Route ${route} is missing canonical link in headTags`);
  }

  const outputHtml = injectPrerenderedPage(templateHtml, route, appHtml, headTags);
  const targetFile =
    route === '/'
      ? path.join(distDir, 'index.html')
      : path.join(distDir, `${route.replace(/^\/+/, '')}.html`);

  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.writeFileSync(targetFile, outputHtml);
  console.log(
    `[prerender] Rendered ${route} -> ${path.relative(rootDir, targetFile)} (${Buffer.byteLength(outputHtml)} bytes)`,
  );
}

fs.rmSync(ssrOutDir, { recursive: true, force: true });
console.log('[prerender] Cleaned up temporary dist-ssr/');
