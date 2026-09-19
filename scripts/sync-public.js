const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Copy directories
const dirsToCopy = ['css', 'js', 'data'];
for (const dir of dirsToCopy) {
  const src = path.join(rootDir, dir);
  const dest = path.join(publicDir, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`Synced ${dir}/ to public/${dir}/`);
  }
}

// 2. Copy HTML files
const htmlFiles = [
  'index.html',
  'chamber.html',
  'bench.html',
  'ledger.html',
  'verdict.html',
  'method.html',
  'disclaimer.html'
];

for (const file of htmlFiles) {
  const src = path.join(rootDir, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to public/${file}`);
  }
}

console.log('Public sync completed successfully!');
