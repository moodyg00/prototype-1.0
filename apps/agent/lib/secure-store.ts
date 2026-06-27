import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import prisma from './prisma';

const STORE_DIR = path.join(process.cwd(), 'logs', 'secure');
const CREDS_FILE = path.join(STORE_DIR, 'credentials.enc');
const SESSIONS_DIR = path.join(STORE_DIR, 'sessions');

try {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
} catch {
  // Non-fatal: read-only fs on some hosting platforms
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const DEFAULT_PASSPHRASE = 'dev-only-default-passphrase-do-not-use-in-production';

/**
 * Secure store for credentials and browser sessions.
 * 
 * Credentials are encrypted at rest with AES-256-GCM using a server-side default key
 * (or process.env.SECURE_PASSPHRASE if set). 
 * 
 * The reasoner only ever sees high-level markers like "use stored credentials for the current domain".
 * Real values are decrypted and injected ONLY at Playwright execution time in the driver.
 * Never sent to the model.
 */

function getKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.scryptSync(passphrase, salt, KEY_LENGTH);
}

function encrypt(data: string, passphrase: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getKey(passphrase, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  // Format: salt:iv:tag:encrypted
  return [
    salt.toString('hex'),
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted.toString('hex')
  ].join(':');
}

function decrypt(encryptedData: string, passphrase: string): string {
  const [saltHex, ivHex, tagHex, encryptedHex] = encryptedData.split(':');
  if (!saltHex || !ivHex || !tagHex || !encryptedHex) {
    throw new Error('Invalid encrypted data format');
  }
  
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  
  const key = getKey(passphrase, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export interface Credential {
  username: string;
  password: string;
}

export class SecureStore {
  private passphrase: string;

  constructor(passphrase?: string) {
    this.passphrase = passphrase || process.env.SECURE_PASSPHRASE || DEFAULT_PASSPHRASE;
    if (this.passphrase === DEFAULT_PASSPHRASE) {
      console.warn('[SecureStore] Using default dev passphrase. Set SECURE_PASSPHRASE env for better security.');
    }
  }

  private normalizeDomain(domain: string): string {
    // Normalize to base domain for reliable lookup across common auth subdomains
    // (e.g. accounts.google.com, login.microsoftonline.com → google.com, microsoftonline.com)
    let d = domain.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (d.startsWith('www.')) d = d.slice(4);
    const authPrefixes = ['accounts.', 'login.', 'auth.', 'secure.', 'my.', 'signin.', 'account.', 'www.'];
    for (const p of authPrefixes) {
      if (d.startsWith(p)) {
        d = d.slice(p.length);
        break;
      }
    }
    return d;
  }

  private async loadEncryptedStore(): Promise<Record<string, string>> {
    try {
      // Prefer DB if connected
      if (prisma) {
        const records = await prisma.storedCredential.findMany();
        const store: Record<string, string> = {};
        for (const r of records) {
          store[r.domain] = r.encrypted;
        }
        return store;
      }
    } catch (e) {
      console.warn('[SecureStore] DB load failed, falling back to file:', (e as Error).message);
    }

    // Fallback to file (legacy)
    if (!fs.existsSync(CREDS_FILE)) return {};
    try {
      const data = fs.readFileSync(CREDS_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private async saveEncryptedStore(store: Record<string, string>) {
    try {
      if (prisma) {
        // Upsert each
        for (const [domain, encrypted] of Object.entries(store)) {
          await prisma.storedCredential.upsert({
            where: { domain },
            update: { encrypted },
            create: { domain, encrypted },
          });
        }
        return;
      }
    } catch (e) {
      console.warn('[SecureStore] DB save failed, falling back to file:', (e as Error).message);
    }

    fs.writeFileSync(CREDS_FILE, JSON.stringify(store, null, 2));
  }

  // Store credentials for a domain (e.g., "example.com")
  async setCredential(domain: string, cred: Credential) {
    const norm = this.normalizeDomain(domain);
    const store = await this.loadEncryptedStore();
    const plain = JSON.stringify(cred);
    
    if (this.passphrase) {
      store[norm] = encrypt(plain, this.passphrase);
    } else {
      store[norm] = plain; // Unencrypted fallback - only for local dev
    }
    await this.saveEncryptedStore(store);
  }

  async getCredential(domain: string): Promise<Credential | null> {
    const norm = this.normalizeDomain(domain);
    const store = await this.loadEncryptedStore();
    const data = store[norm];
    if (!data) return null;

    try {
      const plain = this.passphrase ? decrypt(data, this.passphrase) : data;
      return JSON.parse(plain);
    } catch (e) {
      console.error('[SecureStore] Failed to decrypt credential for', norm);
      return null;
    }
  }

  // Session state for Playwright (cookies etc.) - stored in plain JSON but contains no passwords after login
  async saveSession(domain: string, state: any) {
    const norm = this.normalizeDomain(domain);
    try {
      if (prisma) {
        await prisma.sessionState.upsert({
          where: { domain: norm },
          update: { state },
          create: { domain: norm, state },
        });
        return;
      }
    } catch (e) {
      console.warn('[SecureStore] DB session save failed, file fallback');
    }
    const file = path.join(SESSIONS_DIR, `${norm.replace(/[^a-z0-9]/gi, '_')}.json`);
    fs.writeFileSync(file, JSON.stringify(state, null, 2));
  }

  async loadSession(domain: string): Promise<any | null> {
    const norm = this.normalizeDomain(domain);
    try {
      if (prisma) {
        const record = await prisma.sessionState.findUnique({ where: { domain: norm } });
        if (record) return record.state;
      }
    } catch (e) {
      console.warn('[SecureStore] DB session load failed, file fallback');
    }
    const file = path.join(SESSIONS_DIR, `${norm.replace(/[^a-z0-9]/gi, '_')}.json`);
    if (!fs.existsSync(file)) return null;
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return null;
    }
  }

  // For basic auth behind directories
  async getHttpCredentials(domain: string) {
    const cred = await this.getCredential(domain);
    if (!cred) return null;
    return { username: cred.username, password: cred.password };
  }
}

// Singleton for the app (passphrase should come from secure UI input or env)
let storeInstance: SecureStore | null = null;
export function getSecureStore(passphrase?: string): SecureStore {
  if (!storeInstance) {
    storeInstance = new SecureStore(passphrase);
  } else if (passphrase) {
    storeInstance = new SecureStore(passphrase); // allow re-init with new passphrase
  }
  return storeInstance;
}