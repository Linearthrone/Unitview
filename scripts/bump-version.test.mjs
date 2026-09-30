import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { bumpWorkspace, nextPatchVersion, rewriteAppVersionFallback } from './bump-version.mjs';

test('next patch version increments only the patch', () => {
  assert.equal(nextPatchVersion('5.4.0'), '5.4.1');
  assert.equal(nextPatchVersion('5.4.9'), '5.4.10');
  assert.equal(nextPatchVersion('5.3.0-c'), '5.3.1');
});

test('next patch version rejects junk', () => {
  assert.throws(() => nextPatchVersion('nope'));
  assert.throws(() => nextPatchVersion('5.4.-1'));
});

test('APP_VERSION_FALLBACK rewrite keeps the rest of the file', () => {
  const source = "/** note */\nexport const APP_VERSION_FALLBACK = '5.4.0';\n";
  assert.equal(
    rewriteAppVersionFallback(source, '5.4.1'),
    "/** note */\nexport const APP_VERSION_FALLBACK = '5.4.1';\n",
  );
});

test('bumpWorkspace writes root, renderer, and fallback together', () => {
  const dir = mkdtempSync(join(tmpdir(), 'unitview-bump-'));
  mkdirSync(join(dir, 'renderer/src/lib'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), `${JSON.stringify({ name: 'unitview-windows', version: '5.4.0' }, null, 2)}\n`);
  writeFileSync(join(dir, 'renderer/package.json'), `${JSON.stringify({ name: 'unitview-renderer', version: '5.4.0' }, null, 2)}\n`);
  writeFileSync(
    join(dir, 'renderer/src/lib/app-version.ts'),
    "export const APP_VERSION_FALLBACK = '5.4.0';\n",
  );

  const version = bumpWorkspace(dir);
  assert.equal(version, '5.4.1');
  assert.equal(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version, '5.4.1');
  assert.equal(JSON.parse(readFileSync(join(dir, 'renderer/package.json'), 'utf8')).version, '5.4.1');
  assert.match(readFileSync(join(dir, 'renderer/src/lib/app-version.ts'), 'utf8'), /5\.4\.1/);
});
