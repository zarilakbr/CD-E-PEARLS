import fs from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let commitHash = '54b3095';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  console.warn('Could not determine git commit hash, using fallback:', e.message);
}

const buildTime = new Date().toISOString();
const versionData = {
  commit: commitHash,
  buildTime: buildTime,
  version: '1.0.0-tahap-q3'
};

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(path.join(publicDir, 'version.json'), JSON.stringify(versionData, null, 2) + '\n');
console.log('[generate-version] Generated public/version.json:', versionData);

