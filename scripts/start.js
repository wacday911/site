// Production server with auto-deploy
// Runs astro preview (static file serving) + periodic git pull + rebuild
// New GitHub pushes auto-deploy within ~2 minutes — no server restart needed

import { execSync, spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = process.env.SERVER_PORT || 4321;
const PULL_INTERVAL = 2 * 60 * 1000;

let preview = null;
let building = false;

function log(msg) {
  process.stdout.write(`[auto-deploy] ${msg}\n`);
}

function gitPull() {
  try {
    const result = execSync('git pull', { cwd: ROOT, encoding: 'utf-8' });
    const hasChanges = !result.includes('Already up to date');
    if (hasChanges) log('New commits pulled');
    return hasChanges;
  } catch {
    return false;
  }
}

function npmBuild() {
  if (building) return;
  building = true;
  log('Building...');
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
    log('Build complete');
  } catch {
    log('Build failed');
  }
  building = false;
}

function startPreview() {
  if (preview) preview.kill();
  preview = spawn('npx', ['astro', 'preview', '--host', '0.0.0.0', '--port', String(PORT)], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env },
  });
  preview.on('exit', (code) => {
    log(`Preview server exited (code: ${code})`);
    if (code !== 0) {
      log('Restarting preview server...');
      startPreview();
    }
  });
}

function checkAndRebuild() {
  if (gitPull()) {
    npmBuild();
  }
}

// Initial setup — always build on start (Wisp already pulled latest)
log('Starting...');
gitPull();
npmBuild();
startPreview();

// Periodic check — only rebuild when new commits detected
setInterval(checkAndRebuild, PULL_INTERVAL);

function shutdown() {
  log('Shutting down...');
  if (preview) preview.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
