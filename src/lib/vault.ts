import type { AppState } from './types'

/**
 * Encryption at rest, for when a parent sets a passcode.
 *
 * Two keys, the usual envelope arrangement:
 *  - a random 256-bit data key encrypts the state (AES-GCM);
 *  - a key derived from the passcode (PBKDF2-SHA-256) encrypts the data key.
 * Changing the passcode re-wraps the data key and never re-encrypts the data.
 * It also leaves room to wrap the same data key with a Keychain or Keystore
 * key on native, for biometric unlock, without touching this format.
 *
 * Everything here is WebCrypto, so it runs the same in a browser and in the
 * Capacitor webview, with no dependency to audit.
 */

/** OWASP's 2023 floor for PBKDF2-HMAC-SHA256. Stored per vault so it can rise. */
export const KDF_ITERATIONS = 600_000

export const MIN_PASSCODE_LENGTH = 6

/** Binds every ciphertext to this format, so one can't be swapped for another. */
const AAD = new TextEncoder().encode('twohomes-vault-v1')

interface Sealed {
  iv: string
  data: string
}

export interface VaultHeader {
  format: 'twohomes-vault'
  v: 1
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string }
  /** The data key, encrypted with the passcode key. */
  key: Sealed
}

export interface VaultRecord extends VaultHeader {
  /** The state as JSON, gzipped where the platform can, then encrypted. */
  payload: Sealed & { zip: 'gzip' | 'none' }
}

/** Raised for a wrong passcode, and for a vault that has been tampered with. */
export class WrongPasscodeError extends Error {
  constructor() {
    super('wrong passcode')
    this.name = 'WrongPasscodeError'
  }
}

export function isVaultRecord(value: unknown): value is VaultRecord {
  const v = value as VaultRecord | null
  return (
    typeof v === 'object' &&
    v !== null &&
    v.format === 'twohomes-vault' &&
    v.v === 1 &&
    typeof v.kdf?.salt === 'string' &&
    typeof v.kdf?.iterations === 'number' &&
    typeof v.key?.iv === 'string' &&
    typeof v.payload?.data === 'string'
  )
}

/** A new vault: a fresh data key, wrapped with a key from this passcode. */
export async function createVault(passcode: string): Promise<{ header: VaultHeader; dataKey: CryptoKey }> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const passKey = await derivePassKey(passcode, salt, KDF_ITERATIONS)
  // Extractable only for the moment it takes to wrap it; the copy we keep is not.
  const raw = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const header: VaultHeader = {
    format: 'twohomes-vault',
    v: 1,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: KDF_ITERATIONS, salt: toBase64(salt) },
    key: await wrap(raw, passKey),
  }
  return { header, dataKey: await unwrap(header.key, passKey, false) }
}

/** The data key, if the passcode is right. Throws WrongPasscodeError if not. */
export async function openVault(header: VaultHeader, passcode: string): Promise<CryptoKey> {
  const passKey = await derivePassKey(passcode, fromBase64(header.kdf.salt), header.kdf.iterations)
  return unwrap(header.key, passKey, false)
}

/** Same data key, new passcode. The current one is checked first. */
export async function rewrapVault(header: VaultHeader, current: string, next: string): Promise<VaultHeader> {
  const oldKey = await derivePassKey(current, fromBase64(header.kdf.salt), header.kdf.iterations)
  const dataKey = await unwrap(header.key, oldKey, true)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const newKey = await derivePassKey(next, salt, KDF_ITERATIONS)
  return {
    ...header,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: KDF_ITERATIONS, salt: toBase64(salt) },
    key: await wrap(dataKey, newKey),
  }
}

export async function seal(header: VaultHeader, dataKey: CryptoKey, state: AppState): Promise<VaultRecord> {
  const json = new TextEncoder().encode(JSON.stringify(state))
  const zip = 'CompressionStream' in globalThis ? 'gzip' : 'none'
  const plain = zip === 'gzip' ? await gzip(json) : json
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: AAD }, dataKey, plain)
  return {
    format: header.format,
    v: header.v,
    kdf: header.kdf,
    key: header.key,
    payload: { iv: toBase64(iv), data: toBase64(new Uint8Array(data)), zip },
  }
}

/** The decrypted state, unvalidated: callers pass it through migrate or sanitize. */
export async function unseal(record: VaultRecord, dataKey: CryptoKey): Promise<unknown> {
  let plain: ArrayBuffer
  try {
    plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(record.payload.iv), additionalData: AAD },
      dataKey,
      fromBase64(record.payload.data),
    )
  } catch {
    throw new WrongPasscodeError()
  }
  const bytes = record.payload.zip === 'gzip' ? await gunzip(new Uint8Array(plain)) : new Uint8Array(plain)
  return JSON.parse(new TextDecoder().decode(bytes))
}

export function headerOf(record: VaultRecord): VaultHeader {
  return { format: record.format, v: record.v, kdf: record.kdf, key: record.key }
}

async function derivePassKey(passcode: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passcode.normalize('NFC')),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  )
}

async function wrap(dataKey: CryptoKey, passKey: CryptoKey): Promise<Sealed> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.wrapKey('raw', dataKey, passKey, { name: 'AES-GCM', iv, additionalData: AAD })
  return { iv: toBase64(iv), data: toBase64(new Uint8Array(data)) }
}

async function unwrap(sealed: Sealed, passKey: CryptoKey, extractable: boolean): Promise<CryptoKey> {
  try {
    return await crypto.subtle.unwrapKey(
      'raw',
      fromBase64(sealed.data),
      passKey,
      { name: 'AES-GCM', iv: fromBase64(sealed.iv), additionalData: AAD },
      { name: 'AES-GCM', length: 256 },
      extractable,
      ['encrypt', 'decrypt'],
    )
  } catch {
    // AES-GCM can't tell a wrong key from altered data, and neither should we.
    throw new WrongPasscodeError()
  }
}

async function gzip(bytes: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** Chunked, because spreading a few megabytes of photos into one call overflows the stack. */
function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
