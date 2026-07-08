import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), '.image-cache');
const PUBLIC_DIR = join(process.cwd(), 'public');

function contentHash(data) {
  return createHash('sha256').update(data).digest('hex').slice(0, 16);
}

export async function downloadImage(url, slug, index) {
  const ext = url.split('?')[0].split('.').pop().replace(/[^a-z0-9]/gi, '') || 'jpg';
  const filename = `${slug}-${index}.${ext}`;
  const cachePath = join(CACHE_DIR, filename);
  const publicPath = join(PUBLIC_DIR, filename);

  if (existsSync(cachePath)) {
    return { filename, path: `/${filename}`, cachePath, publicPath, cached: true };
  }

  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!resp.ok) {
    throw new Error(`Download failed: ${resp.status} for ${url}`);
  }

  const buffer = Buffer.from(await resp.arrayBuffer());
  writeFileSync(cachePath, buffer);
  writeFileSync(publicPath, buffer);

  return { filename, path: `/${filename}`, cachePath, publicPath, cached: false };
}

export function clearCache() {
  if (existsSync(CACHE_DIR)) {
    rmSync(CACHE_DIR, { recursive: true, force: true });
  }
}
