import { app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { decryptUtf8, encryptUtf8, type EncryptedPayload } from '../security/crypto-core';
import { writeFileAtomicRestricted } from './atomic-write';

const VAULT_FILE = 'phi.vault.json';
const MASTER_KEY_FILE = 'master.key';
const AUDIT_FILE = 'audit.jsonl';
const EPIC_SECRETS_FILE = 'epic.secrets.json';

function userDataPath(...parts: string[]): string {
  return path.join(app.getPath('userData'), ...parts);
}

function writeRestricted(filePath: string, contents: string | Buffer): void {
  fs.writeFileSync(filePath, contents, { encoding: Buffer.isBuffer(contents) ? undefined : 'utf8', mode: 0o600 });
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {
    // Windows may ignore POSIX mode bits
  }
}

/** The vault key is 32 raw bytes. On disk it is the base64 form, wrapped by the OS keychain when available. */
function materialToMasterKey(material: string | Buffer): Buffer {
  if (Buffer.isBuffer(material) && material.length === 32) return material;
  const text = Buffer.isBuffer(material) ? material.toString('utf8') : material;
  const decoded = Buffer.from(text, 'base64');
  if (decoded.length === 32) return decoded;
  if (Buffer.isBuffer(material) && material.length >= 32) return material.subarray(0, 32);
  return Buffer.from(text).subarray(0, 32);
}

function loadOrCreateMasterKey(): Buffer {
  const keyPath = userDataPath(MASTER_KEY_FILE);
  if (fs.existsSync(keyPath)) {
    const raw = fs.readFileSync(keyPath);
    if (safeStorage.isEncryptionAvailable()) {
      try {
        return materialToMasterKey(safeStorage.decryptString(raw));
      } catch {
        // Fall through to treat as raw key from older/dev environments
      }
    }
    return materialToMasterKey(raw);
  }

  const key = randomBytes(32);
  if (safeStorage.isEncryptionAvailable()) {
    writeRestricted(keyPath, safeStorage.encryptString(key.toString('base64')));
  } else {
    writeRestricted(keyPath, key);
  }
  return key;
}

export function vaultExists(): boolean {
  return fs.existsSync(userDataPath(VAULT_FILE));
}

export function saveVault(plaintext: string): void {
  const payload = encryptUtf8(plaintext, loadOrCreateMasterKey());
  writeFileAtomicRestricted(userDataPath(VAULT_FILE), JSON.stringify(payload));
}

/** Older builds saved the vault with the base64 text itself, not the decoded 32-byte key. */
function masterKeyCandidates(): Buffer[] {
  const keyPath = userDataPath(MASTER_KEY_FILE);
  if (!fs.existsSync(keyPath)) return [loadOrCreateMasterKey()];
  const raw = fs.readFileSync(keyPath);
  const candidates: Buffer[] = [];
  const push = (key: Buffer) => {
    if (!candidates.some((existing) => existing.equals(key))) candidates.push(key);
  };
  if (safeStorage.isEncryptionAvailable()) {
    try {
      const text = safeStorage.decryptString(raw);
      const decoded = Buffer.from(text, 'base64');
      if (decoded.length === 32) push(decoded);
      push(Buffer.from(text));
    } catch {
      // Older key files were raw bytes.
    }
  }
  if (raw.length === 32) push(raw);
  else if (raw.length >= 32) push(raw.subarray(0, 32));
  return candidates.length > 0 ? candidates : [loadOrCreateMasterKey()];
}

export function loadVault(): string | null {
  const filePath = userDataPath(VAULT_FILE);
  if (!fs.existsSync(filePath)) return null;
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as EncryptedPayload;
  let lastError: unknown;
  for (const key of masterKeyCandidates()) {
    try {
      return decryptUtf8(parsed, key);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Vault decrypt failed');
}

export function saveEpicSecrets(secrets: { privateKeyPem?: string }): void {
  const payload = encryptUtf8(JSON.stringify(secrets), loadOrCreateMasterKey());
  writeRestricted(userDataPath(EPIC_SECRETS_FILE), JSON.stringify(payload));
}

export function loadEpicSecrets(): { privateKeyPem?: string } {
  const filePath = userDataPath(EPIC_SECRETS_FILE);
  if (!fs.existsSync(filePath)) return {};
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as EncryptedPayload;
  const decoded = JSON.parse(decryptUtf8(parsed, loadOrCreateMasterKey())) as { privateKeyPem?: string };
  return decoded;
}

export function appendAuditLine(line: string): void {
  fs.appendFileSync(userDataPath(AUDIT_FILE), `${line}\n`, { encoding: 'utf8', mode: 0o600 });
}

export function readAuditLines(maxLines = 200): string[] {
  const filePath = userDataPath(AUDIT_FILE);
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  return lines.slice(-Math.max(1, maxLines));
}

export function vaultUsesOsKeychain(): boolean {
  return safeStorage.isEncryptionAvailable();
}
