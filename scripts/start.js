// Production dev server with auto-deploy
// Runs astro dev (hot-reload) + periodic git pull
// New GitHub pushes auto-deploy within ~2 minutes — no server restart needed

import { execSync, spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = process.env.SERVER_PORT || 4321;
const PULL_INTERVAL = 2 * 60 * 1000;

function gitPull() {
  try {
    execSync('git pull', { cwd: ROOT, stdio: 'pipe' });
  } catch {
    // silent — git pull can fail if no remote or network issues
  }
}

// Initial pull
gitPull();

// Periodic pull
const interval = setInterval(gitPull, PULL_INTERVAL);

// Start astro dev server
const dev = spawn('npx', ['astro', 'dev', '--host', '0.0.0.0', '--port', String(PORT)], {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env },
});

function shutdown() {
  clearInterval(interval);
  dev.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
