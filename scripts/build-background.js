// Build background.ts using esbuild already installed under client/node_modules/.pnpm
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const pnpmDir = path.join(root, "client", "node_modules", ".pnpm");

if (!fs.existsSync(pnpmDir)) {
  console.error("[build-background] pnpm store not found at", pnpmDir);
  process.exit(1);
}

const candidates = fs
  .readdirSync(pnpmDir)
  .filter((p) => p.startsWith("esbuild@"));

if (candidates.length === 0) {
  console.error(
    "[build-background] esbuild package not found under client/node_modules/.pnpm"
  );
  process.exit(1);
}

const esbuildRoot = path.join(
  pnpmDir,
  candidates[0],
  "node_modules",
  "esbuild"
);
// Windows에서는 .cmd 파일을 사용
const isWindows = process.platform === "win32";
const binPath = isWindows
  ? path.join(esbuildRoot, "bin", "esbuild.cmd")
  : path.join(esbuildRoot, "bin", "esbuild");

if (!fs.existsSync(binPath)) {
  console.error("[build-background] esbuild binary not found at", binPath);
  process.exit(1);
}

console.log("[build-background] Running esbuild at:", binPath);
console.log("[build-background] Working directory:", root);
console.log("[build-background] Input file: extension/background.ts");

const result = spawnSync(
  "npx",
  [
    "esbuild",
    "extension/background.ts",
    "--bundle",
    "--platform=browser",
    "--outfile=extension/background.js",
  ],
  {
    cwd: root,
    stdio: ["pipe", "pipe", "pipe"],
    encoding: "utf-8",
  }
);

console.log("[build-background] stdout:", result.stdout);
console.log("[build-background] stderr:", result.stderr);
console.log("[build-background] Exit code:", result.status);
console.log("[build-background] Error:", result.error);

if (result.status !== 0 || result.error) {
  console.error("[build-background] Build failed");
  if (result.stderr)
    console.error("[build-background] Error output:", result.stderr);
  process.exit(result.status ?? 1);
}

console.log("✅ background.js built with", binPath);
