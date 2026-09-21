const fs = require('fs');
const path = require('path');

const htmlFiles = [
  'index.html',
  'chamber.html',
  'bench.html',
  'ledger.html',
  'verdict.html',
  'method.html',
  'disclaimer.html'
];

const dirs = ['.', 'public'];

for (const dir of dirs) {
  for (const file of htmlFiles) {
    const fullPath = path.join(dir, file);
    if (!fs.existsSync(fullPath)) continue;
    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace all relative and absolute html page links
    content = content.replace(/href=["']\/?index\.html["']/g, 'href="/overview"');
    content = content.replace(/href=["']\/?chamber\.html["']/g, 'href="/chamber"');
    content = content.replace(/href=["']\/?bench\.html["']/g, 'href="/bench"');
    content = content.replace(/href=["']\/?ledger\.html["']/g, 'href="/ledger"');
    content = content.replace(/href=["']\/?verdict\.html["']/g, 'href="/verdict"');
    content = content.replace(/href=["']\/?method\.html["']/g, 'href="/method"');
    content = content.replace(/href=["']\/?disclaimer\.html["']/g, 'href="/disclaimer"');

    // Also replace in header/meta tags or scripts if any
    content = content.replace(/content=["']\/?index\.html["']/g, 'content="/overview"');

    // Ensure <base href="/"> is present for clean nested routes
    if (!content.includes('<base href="/">')) {
      content = content.replace(/<head>/i, '<head>\n  <base href="/">');
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Updated clean URLs in:', fullPath);
  }
}
