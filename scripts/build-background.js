// Build background.ts using esbuild already installed under client/node_modules/.pnpm
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const root = path.join(__dirname, '..')
const pnpmDir = path.join(root, 'client', 'node_modules', '.pnpm')

if (!fs.existsSync(pnpmDir)) {
  console.error('[build-background] pnpm store not found at', pnpmDir)
  process.exit(1)
}

const candidates = fs.readdirSync(pnpmDir).filter((p) => p.startsWith('esbuild@'))

if (candidates.length === 0) {
  console.error('[build-background] esbuild package not found under client/node_modules/.pnpm')
  process.exit(1)
}

const esbuildRoot = path.join(pnpmDir, candidates[0], 'node_modules', 'esbuild')
const binPath = path.join(esbuildRoot, 'bin', 'esbuild')

if (!fs.existsSync(binPath)) {
  console.error('[build-background] esbuild binary not found at', binPath)
  process.exit(1)
}

const result = spawnSync(binPath, ['extension/background.ts', '--bundle', '--platform=browser', '--outfile=extension/background.js'], {
  cwd: root,
  stdio: 'inherit',
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log('✅ background.js built with', binPath)
