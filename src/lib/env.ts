// Lightweight environment variable loader for Node.js environments
import fs from 'node:fs';
import path from 'node:path';

export function loadEnv(): void {
  const rootDir = path.resolve(__dirname, '../..');
  const envFiles = ['.env.local', '.env'];

  for (const file of envFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        content.split('\n').forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
      } catch (_) {}
    }
  }

  // Preserve test environment when running test runners
  if (process.argv.some(arg => typeof arg === 'string' && (arg.includes('test') || arg.includes('--test')))) {
    process.env.NODE_ENV = 'test';
  }
}

loadEnv();
