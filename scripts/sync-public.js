const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function copyDirectoryRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(srcPath);
        fs.writeFileSync(destPath, content);
      } catch (err) {
        // Fallback with copyFileSync
        try {
          fs.copyFileSync(srcPath, destPath);
        } catch (e) {
          console.warn(`Warning copying ${srcPath} -> ${destPath}:`, e.message);
        }
      }
    }
  }
}

// 1. Copy directories
const dirsToCopy = ['css', 'js', 'data'];
for (const dir of dirsToCopy) {
  const src = path.join(rootDir, dir);
  const dest = path.join(publicDir, dir);
  copyDirectoryRecursive(src, dest);
  console.log(`Synced ${dir}/ to public/${dir}/`);
}

// 2. Copy HTML files
const htmlFiles = [
  'index.html',
  'chamber.html',
  'bench.html',
  'crypto-bench.html',
  'ledger.html',
  'verdict.html',
  'method.html',
  'disclaimer.html'
];

for (const file of htmlFiles) {
  const src = path.join(rootDir, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    try {
      const content = fs.readFileSync(src);
      fs.writeFileSync(dest, content);
      console.log(`Copied ${file} to public/${file}`);
    } catch (err) {
      console.warn(`Warning copying ${file}:`, err.message);
    }
  }
}

console.log('Public sync completed successfully!');
