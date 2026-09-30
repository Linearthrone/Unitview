import { execSync } from 'node:child_process';
import { chmodSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const gitDir = resolve(rootDir, '.git');
const hookPath = resolve(rootDir, '.githooks/pre-commit');

if (!existsSync(gitDir)) {
  process.exit(0);
}

if (existsSync(hookPath)) {
  chmodSync(hookPath, 0o755);
}

execSync('git config core.hooksPath .githooks', { cwd: rootDir, stdio: 'inherit' });
