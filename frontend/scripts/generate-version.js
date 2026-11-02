import fs from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let commitHash = '0eec25d';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  console.warn('Could not determine git commit hash, using fallback:', e.message);
}

const buildTime = new Date().toISOString();
const versionData = {
  commit: commitHash,
  buildTime: buildTime,
  version: '1.0.0-tahap-s'
};

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(path.join(publicDir, 'version.json'), JSON.stringify(versionData, null, 2) + '\n');
console.log('[generate-version] Generated public/version.json:', versionData);

// Controllable indexing via VITE_ALLOW_INDEXING (default false)
const allowIndexing = process.env.VITE_ALLOW_INDEXING === 'true';

const robotsContent = allowIndexing
  ? 'User-agent: *\nAllow: /\n'
  : 'User-agent: *\nDisallow: /\n';

fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent);
console.log(`[generate-version] Generated public/robots.txt (allowIndexing=${allowIndexing})`);

const headersContent = allowIndexing
  ? `/*\n  X-Frame-Options: SAMEORIGIN\n  X-Content-Type-Options: nosniff\n`
  : `/*\n  X-Robots-Tag: noindex, nofollow\n  X-Frame-Options: SAMEORIGIN\n  X-Content-Type-Options: nosniff\n`;

fs.writeFileSync(path.join(publicDir, '_headers'), headersContent);
console.log(`[generate-version] Generated public/_headers (allowIndexing=${allowIndexing})`);
