import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function stampedPackVersion(baseVersion, patch) {
  const release = String(baseVersion).split('-')[0] ?? '5.4.0';
  const bits = release.split('.');
  const major = Number.parseInt(bits[0] ?? '5', 10);
  const minor = Number.parseInt(bits[1] ?? '4', 10);
  const next = Number(patch);
  if (!Number.isFinite(major) || !Number.isFinite(minor) || !Number.isFinite(next) || next < 0) {
    throw new Error('Invalid pack version inputs');
  }
  return `${major}.${minor}.${Math.floor(next)}`;
}

const patchArg = process.argv[2];
if (!patchArg) {
  console.error('Usage: node scripts/stamp-pack-version.mjs <patch>');
  process.exit(1);
}

const rootPkgPath = resolve(process.cwd(), 'package.json');
const rendererPkgPath = resolve(process.cwd(), 'renderer/package.json');
const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'));
const version = stampedPackVersion(rootPkg.version, patchArg);
rootPkg.version = version;
writeFileSync(rootPkgPath, `${JSON.stringify(rootPkg, null, 2)}\n`);

const rendererPkg = JSON.parse(readFileSync(rendererPkgPath, 'utf8'));
rendererPkg.version = version;
writeFileSync(rendererPkgPath, `${JSON.stringify(rendererPkg, null, 2)}\n`);

console.log(`Stamped pack version ${version}`);
