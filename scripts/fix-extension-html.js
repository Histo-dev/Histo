// Fix HTML files for Chrome extension by updating relative paths
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const distDir = path.join(root, "client", "dist");
const extDir = path.join(root, "extension");

// Read popup.html and options.html from dist
const files = [
  { name: "popup.html", type: "popup" },
  { name: "options.html", type: "options" },
];

files.forEach(({ name, type }) => {
  const distFile = path.join(distDir, name);
  const extFile = path.join(extDir, name);

  if (!fs.existsSync(distFile)) {
    console.log(`[fix-extension-html] ${name} not found in dist/`);
    return;
  }

  let html = fs.readFileSync(distFile, "utf-8");

  // Convert relative paths ./assets/ to dist/assets/
  html = html.replace(/src="\.\/assets\//g, 'src="dist/assets/');
  html = html.replace(/href="\.\/assets\//g, 'href="dist/assets/');

  fs.writeFileSync(extFile, html, "utf-8");
  console.log(`[fix-extension-html] ✅ Fixed ${name}`);
});
