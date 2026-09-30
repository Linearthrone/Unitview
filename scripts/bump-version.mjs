import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep as pathSep } from 'node:path';
import { fileURLToPath } from 'node:url';

const FALLBACK_PATTERN = /export const APP_VERSION_FALLBACK = '[^']+'/;

export function nextPatchVersion(version) {
  const release = String(version).split('-')[0]?.trim() ?? '';
  const bits = release.split('.');
  const major = Number.parseInt(bits[0] ?? '', 10);
  const minor = Number.parseInt(bits[1] ?? '', 10);
  const patch = Number.parseInt(bits[2] ?? '', 10);
  if (!Number.isFinite(major) || !Number.isFinite(minor) || !Number.isFinite(patch) || patch < 0) {
    throw new Error(`Invalid version: ${version}`);
  }
  return `${major}.${minor}.${patch + 1}`;
}

export function rewriteAppVersionFallback(source, version) {
  if (!FALLBACK_PATTERN.test(source)) {
    throw new Error('APP_VERSION_FALLBACK not found');
  }
  return source.replace(FALLBACK_PATTERN, `export const APP_VERSION_FALLBACK = '${version}'`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function bumpWorkspace(rootDir) {
  const rootPkgPath = resolve(rootDir, 'package.json');
  const rendererPkgPath = resolve(rootDir, 'renderer/package.json');
  const fallbackPath = resolve(rootDir, 'renderer/src/lib/app-version.ts');

  const rootPkg = readJson(rootPkgPath);
  const version = nextPatchVersion(rootPkg.version);
  rootPkg.version = version;
  writeJson(rootPkgPath, rootPkg);

  const rendererPkg = readJson(rendererPkgPath);
  rendererPkg.version = version;
  writeJson(rendererPkgPath, rendererPkg);

  const fallbackSource = readFileSync(fallbackPath, 'utf8');
  writeFileSync(fallbackPath, rewriteAppVersionFallback(fallbackSource, version));

  return version;
}

const thisFile = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
const invokedDirectly = invokedPath.endsWith(`${pathSep}bump-version.mjs`) || invokedPath.endsWith('/bump-version.mjs');

if (invokedDirectly) {
  const rootDir = resolve(dirname(thisFile), '..');
  const version = bumpWorkspace(rootDir);
  console.log(`Bumped version to ${version}`);
}
