// Build background.ts using esbuild via Node require
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const clientEnvPath = path.join(root, 'client/.env');
const rootEnvPath = path.join(root, '.env');

const readEnvValue = (envPath, key) => {
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const entries = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.startsWith('#'))
      .map((line) => line.split('='))
      .reduce((acc, [k, ...rest]) => {
        const raw = rest.join('=').trim();
        acc[k] = raw.replace(/^['"]|['"]$/g, '');
        return acc;
      }, {});
    return entries[key];
  } catch {
    return undefined;
  }
};

const backendUrl =
  process.env.VITE_BACKEND_URL ||
  readEnvValue(clientEnvPath, 'VITE_BACKEND_URL') ||
  readEnvValue(rootEnvPath, 'VITE_BACKEND_URL') ||
  'http://localhost:3000';

console.log('[build-background] Working directory:', root);
console.log('[build-background] Input file: extension/background.ts');
console.log('[build-background] Output file: extension/background.js');
console.log('[build-background] Backend URL:', backendUrl);

try {
  // Load esbuild from client's node_modules
  const esbuild = require(path.join(root, 'client/node_modules/esbuild'));

  esbuild.buildSync({
    entryPoints: [path.join(root, 'extension/background.ts')],
    bundle: true,
    platform: 'browser',
    outfile: path.join(root, 'extension/background.js'),
    define: {
      'process.env.VITE_BACKEND_URL': JSON.stringify(backendUrl.replace(/\/$/, '')),
    },
  });

  console.log('[build-background] Build succeeded');
} catch (error) {
  console.error('[build-background] Build failed:', error.message);
  process.exit(1);
}
