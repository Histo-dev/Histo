// Build background.ts using esbuild via Node require
const path = require("path");

const root = path.join(__dirname, "..");

console.log("[build-background] Working directory:", root);
console.log("[build-background] Input file: extension/background.ts");
console.log("[build-background] Output file: extension/background.js");

try {
  // Load esbuild from client's node_modules
  const esbuild = require(path.join(root, "client/node_modules/esbuild"));

  esbuild.buildSync({
    entryPoints: [path.join(root, "extension/background.ts")],
    bundle: true,
    platform: "browser",
    outfile: path.join(root, "extension/background.js"),
  });

  console.log("[build-background] Build succeeded");
} catch (error) {
  console.error("[build-background] Build failed:", error.message);
  process.exit(1);
}
