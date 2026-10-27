import type { ParentId } from '../types'
import type { Op } from './engine'

/**
 * The cryptography between the two homes. WebCrypto only.
 *
 * One random secret travels in the invitation link. From it, HKDF derives:
 *  - the AES-GCM key every operation is encrypted with, and
 *  - the token the relay checks before it accepts or returns anything.
 * The relay holds only a hash of the token, so it can't derive the key.
 *
 * Encryption alone can't say which parent wrote an operation, because both
 * hold the same key. So each device also has its own ECDSA P-256 key pair:
 * every operation is signed, and the other home verifies the signature
 * against the public key that parent's device introduced itself with.
 */

const OP_INFO = 'twohomes-ops-v1'
const TOKEN_INFO = 'twohomes-relay-token-v1'

export function newSecret(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)))
}

/** Random, 128 bits, carries no meaning. */
export function newFamilyId(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(16)))
}

async function hkdf(secret: string, info: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', fromBase64Url(secret), 'HKDF', false, ['deriveKey', 'deriveBits'])
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: new TextEncoder().encode(info) },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export function opKey(secret: string): Promise<CryptoKey> {
  return hkdf(secret, OP_INFO)
}

export async function relayToken(secret: string): Promise<string> {
  const material = await crypto.subtle.importKey('raw', fromBase64Url(secret), 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: new TextEncoder().encode(TOKEN_INFO) },
    material,
    256,
  )
  return toBase64Url(new Uint8Array(bits))
}

export async function newSigningKeys(): Promise<{ privateKey: JsonWebKey; publicKey: JsonWebKey }> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  return {
    privateKey: await crypto.subtle.exportKey('jwk', pair.privateKey),
    publicKey: await crypto.subtle.exportKey('jwk', pair.publicKey),
  }
}

const ECDSA = { name: 'ECDSA', namedCurve: 'P-256' } as const
const SIGN = { name: 'ECDSA', hash: 'SHA-256' } as const

function importPrivate(jwk: JsonWebKey) {
  return crypto.subtle.importKey('jwk', jwk, ECDSA, false, ['sign'])
}

function importPublic(jwk: JsonWebKey) {
  return crypto.subtle.importKey('jwk', { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }, ECDSA, false, ['verify'])
}

/** Ties a ciphertext to its family, so it can't be replayed into another. */
const aad = (familyId: string) => new TextEncoder().encode(`twohomes-op-v1:${familyId}`)

/** Sign, then encrypt. What leaves the device is one opaque string. */
export async function sealOp(op: Op, key: CryptoKey, familyId: string, privateKey: JsonWebKey): Promise<string> {
  const body = JSON.stringify(op)
  const signature = await crypto.subtle.sign(SIGN, await importPrivate(privateKey), new TextEncoder().encode(body))
  const plain = new TextEncoder().encode(JSON.stringify({ body, sig: toBase64Url(new Uint8Array(signature)) }))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(familyId) }, key, plain)
  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(cipher))}`
}

/**
 * Decrypt and verify. Returns null for anything that doesn't decrypt, isn't
 * signed by the parent it names, or introduces a second key for a parent
 * who already has one.
 */
export async function openOp(
  sealed: string,
  key: CryptoKey,
  familyId: string,
  peers: Partial<Record<ParentId, JsonWebKey>>,
): Promise<Op | null> {
  try {
    const [iv, cipher] = sealed.split('.')
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64Url(iv), additionalData: aad(familyId) },
      key,
      fromBase64Url(cipher),
    )
    const { body, sig } = JSON.parse(new TextDecoder().decode(plain)) as { body: string; sig: string }
    const op = JSON.parse(body) as Op
    if (op.author !== 'a' && op.author !== 'b') return null

    const introduced = op.kind === 'member' ? (op.value as { publicKey?: JsonWebKey })?.publicKey : undefined
    const known = peers[op.author]
    // First key per parent is trusted; the relay admits only two devices.
    if (introduced && known && !sameKey(introduced, known)) return null
    const signer = known ?? introduced
    if (!signer) return null

    const ok = await crypto.subtle.verify(SIGN, await importPublic(signer), fromBase64Url(sig), new TextEncoder().encode(body))
    return ok ? op : null
  } catch {
    return null
  }
}

function sameKey(x: JsonWebKey, y: JsonWebKey): boolean {
  return x.x === y.x && x.y === y.y && x.crv === y.crv
}

/** What the invitation link carries, after the `#/join/`. */
export interface Invite {
  v: 1
  /** Family id. */
  f: string
  /** The secret. */
  s: string
  /** The inviting parent. The device that opens the link becomes the other one. */
  p: ParentId
  /** The inviting parent's name, so the join screen can say who is asking. */
  n: string
}

export function encodeInvite(invite: Invite): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(invite)))
}

export function decodeInvite(code: string): Invite | null {
  try {
    const invite = JSON.parse(new TextDecoder().decode(fromBase64Url(code))) as Invite
    const ok =
      invite.v === 1 &&
      typeof invite.f === 'string' &&
      /^[\w-]{16,64}$/.test(invite.f) &&
      typeof invite.s === 'string' &&
      fromBase64Url(invite.s).length === 32 &&
      (invite.p === 'a' || invite.p === 'b') &&
      typeof invite.n === 'string'
    return ok ? { ...invite, n: invite.n.slice(0, 80) } : null
  } catch {
    return null
  }
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
