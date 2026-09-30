#!/usr/bin/env node
/**
 * Generates an RSA key pair and JWKS suitable for Epic SMART Backend Services.
 * Upload jwks.json (or the public certificate) at fhir.epic.com.
 * Keep private.pem only on the Unitview workstation vault.
 */
import { generateKeyPairSync } from 'crypto';
import { writeFileSync } from 'fs';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'jwk' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const jwk = {
  ...publicKey,
  kid: 'unitview-epic-1',
  alg: 'RS384',
  use: 'sig',
};

writeFileSync('private.pem', privateKey, { mode: 0o600 });
writeFileSync('jwks.json', `${JSON.stringify({ keys: [jwk] }, null, 2)}\n`);

console.log('Wrote private.pem and jwks.json');
console.log('Upload jwks.json to Epic. Paste private.pem into Admin → Epic FHIR.');
