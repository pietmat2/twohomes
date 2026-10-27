/**
 * The Twohomes relay: a mailbox for sealed operations.
 *
 * It stores opaque strings in order, per family, and hands them back. It
 * can't read them: the key never reaches it. What it does enforce:
 *  - a family is only usable with its token (it keeps a SHA-256 of it);
 *  - a family has at most two devices, one per home;
 *  - only a registered device can post;
 *  - size caps, so one family or a flood of new ones can't fill the database.
 *
 * Written against the standard Request/Response API, so the same handler runs
 * under Node (relay/dev.mjs) and as this Supabase Edge Function (index.ts).
 * Anything that must be atomic — joining, appending — is the store's job, so
 * a store backed by a database can do it in one statement.
 */

export const LIMITS = {
  bodyBytes: 8 * 1024 * 1024,
  opBytes: 2 * 1024 * 1024,
  opsPerPost: 500,
  opsPerPage: 500,
  devicesPerFamily: 2,
  /** A year of heavy use, photos included, is a few megabytes. */
  bytesPerFamily: 25 * 1024 * 1024,
  families: 5_000,
}

const ID = /^[\w-]{16,64}$/

/**
 * @typedef {{ tokenHash: string, devices: string[], seq: number }} Family
 * @typedef {{ seq: number, device: string, body: string }} StoredOp
 * @typedef {{
 *   getFamily(id: string): Promise<Family | null>,
 *   createFamily(id: string, tokenHash: string, maxFamilies: number): Promise<'created' | 'exists' | 'full'>,
 *   addDevice(id: string, device: string, max: number): Promise<'joined' | 'already' | 'full'>,
 *   removeDevice(id: string, device: string): Promise<void>,
 *   appendOps(id: string, device: string, bodies: string[], maxBytes: number): Promise<number | 'not_a_member' | 'full'>,
 *   listOps(id: string, after: number, limit: number): Promise<StoredOp[]>,
 * }} Store
 */

/** @param {Request} request @param {Store} store @returns {Promise<Response>} */
export async function handle(request, store) {
  if (request.method === 'OPTIONS') return reply(204)
  const url = new URL(request.url)
  const parts = url.pathname.split('/').filter(Boolean)

  if (parts[0] !== 'v1') return reply(404, { error: 'not_found' })
  if (parts[1] === 'health') return reply(200, { ok: true })
  if (parts[1] !== 'families' || !ID.test(parts[2] ?? '')) return reply(404, { error: 'not_found' })

  const familyId = parts[2]
  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '')
  if (!token) return reply(401, { error: 'unauthorized' })
  const tokenHash = await sha256(token)

  // PUT /v1/families/:id — create on first use, or check the token.
  if (parts.length === 3 && request.method === 'PUT') {
    const result = await store.createFamily(familyId, tokenHash, LIMITS.families)
    if (result === 'created') return reply(201, { created: true })
    if (result === 'full') return reply(507, { error: 'relay_full' })
    const existing = await store.getFamily(familyId)
    return existing && equal(existing.tokenHash, tokenHash)
      ? reply(200, { created: false })
      : reply(401, { error: 'unauthorized' })
  }

  const family = await store.getFamily(familyId)
  if (!family || !equal(family.tokenHash, tokenHash)) return reply(401, { error: 'unauthorized' })

  // POST /v1/families/:id/devices — join, while there is room.
  if (parts[3] === 'devices' && parts.length === 4 && request.method === 'POST') {
    const body = await readJson(request)
    const device = body?.device
    if (typeof device !== 'string' || !ID.test(device)) return reply(400, { error: 'bad_device' })
    const result = await store.addDevice(familyId, device, LIMITS.devicesPerFamily)
    if (result === 'full') return reply(409, { error: 'full' })
    return reply(result === 'joined' ? 201 : 200, { joined: true })
  }

  // DELETE /v1/families/:id/devices/:device — leave, freeing the slot.
  if (parts[3] === 'devices' && parts.length === 5 && request.method === 'DELETE') {
    await store.removeDevice(familyId, parts[4])
    return reply(204)
  }

  if (parts[3] === 'ops' && parts.length === 4) {
    // POST — append, in order, each op given the next sequence number.
    if (request.method === 'POST') {
      const body = await readJson(request)
      if (!body) return reply(413, { error: 'too_large' })
      const { device, ops } = body
      if (!Array.isArray(ops) || ops.length === 0 || ops.length > LIMITS.opsPerPost) return reply(400, { error: 'bad_ops' })
      if (!ops.every((op) => typeof op === 'string' && op.length <= LIMITS.opBytes)) return reply(400, { error: 'bad_ops' })
      const last = await store.appendOps(familyId, String(device), ops, LIMITS.bytesPerFamily)
      if (last === 'not_a_member') return reply(403, { error: 'not_a_member' })
      if (last === 'full') return reply(507, { error: 'family_full' })
      return reply(200, { last })
    }
    // GET ?after=N — everything since the reader's cursor, a page at a time.
    if (request.method === 'GET') {
      const after = Math.max(0, Number.parseInt(url.searchParams.get('after') ?? '0', 10) || 0)
      const ops = await store.listOps(familyId, after, LIMITS.opsPerPage)
      return reply(200, { ops, last: family.seq })
    }
  }

  return reply(404, { error: 'not_found' })
}

/**
 * The store logic for anything single-threaded: tests, and the dev server,
 * which handles one request at a time. Persistence is up to `save`.
 * @returns {Store & { families: Map<string, Family & { bytes: number }>, logs: Map<string, StoredOp[]> }}
 */
export function memoryStore() {
  const families = new Map()
  const logs = new Map()
  return {
    families,
    logs,
    async getFamily(id) {
      return families.get(id) ?? null
    },
    async createFamily(id, tokenHash, maxFamilies) {
      if (families.has(id)) return 'exists'
      if (families.size >= maxFamilies) return 'full'
      families.set(id, { tokenHash, devices: [], seq: 0, bytes: 0 })
      return 'created'
    },
    async addDevice(id, device, max) {
      const family = families.get(id)
      if (family.devices.includes(device)) return 'already'
      if (family.devices.length >= max) return 'full'
      family.devices = [...family.devices, device]
      return 'joined'
    },
    async removeDevice(id, device) {
      const family = families.get(id)
      family.devices = family.devices.filter((d) => d !== device)
    },
    async appendOps(id, device, bodies, maxBytes) {
      const family = families.get(id)
      if (!family.devices.includes(device)) return 'not_a_member'
      const bytes = bodies.reduce((sum, body) => sum + body.length, 0)
      if (family.bytes + bytes > maxBytes) return 'full'
      const ops = bodies.map((body, i) => ({ seq: family.seq + i + 1, device, body }))
      logs.set(id, [...(logs.get(id) ?? []), ...ops])
      family.seq += bodies.length
      family.bytes += bytes
      return family.seq
    },
    async listOps(id, after, limit) {
      return (logs.get(id) ?? []).filter((op) => op.seq > after).slice(0, limit)
    },
  }
}

const CORS = {
  // No cookies and no ambient credentials: every request carries its token,
  // so any origin may call. The app's own Content-Security-Policy decides
  // which relay it talks to.
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type, apikey, x-client-info',
  'access-control-max-age': '86400',
}

function reply(status, body) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

async function readJson(request) {
  const text = await request.text()
  if (text.length > LIMITS.bodyBytes) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Constant time, so the hash comparison leaks nothing through timing. */
function equal(x, y) {
  if (x.length !== y.length) return false
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i)
  return diff === 0
}
