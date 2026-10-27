// The Twohomes relay as a Supabase Edge Function.
//
// The handler is relay.mjs beside it, shared with the dev server. This file
// only gives it a Postgres-backed store and strips the /functions/v1/relay
// prefix from the path. Joining is one conditional UPDATE and appending runs
// in one transaction that locks the family row, so concurrent requests can't
// hand out the same sequence number or admit a third device.
//
// Deployed with JWT verification off: requests carry the family's relay
// token, not a Supabase session, and the handler checks it itself.

import postgres from 'npm:postgres@3.4.5'
import { handle, type Store } from './relay.mjs'

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 3, prepare: false })

const store: Store = {
  async getFamily(id) {
    const [row] = await sql`select token_hash, devices, seq from relay.families where id = ${id}`
    return row ? { tokenHash: row.token_hash, devices: row.devices, seq: Number(row.seq) } : null
  },

  async createFamily(id, tokenHash, maxFamilies) {
    const [{ count }] = await sql`select count(*)::int as count from relay.families`
    if (count >= maxFamilies) return 'full'
    const rows = await sql`
      insert into relay.families (id, token_hash) values (${id}, ${tokenHash})
      on conflict (id) do nothing
      returning id`
    return rows.length ? 'created' : 'exists'
  },

  async addDevice(id, device, max) {
    const rows = await sql`
      update relay.families set devices = array_append(devices, ${device})
      where id = ${id} and not (${device} = any (devices)) and cardinality(devices) < ${max}
      returning id`
    if (rows.length) return 'joined'
    const [row] = await sql`select ${device} = any (devices) as member from relay.families where id = ${id}`
    return row?.member ? 'already' : 'full'
  },

  async removeDevice(id, device) {
    await sql`update relay.families set devices = array_remove(devices, ${device}) where id = ${id}`
  },

  async appendOps(id, device, bodies, maxBytes) {
    const bytes = bodies.reduce((sum, body) => sum + body.length, 0)
    // Claiming the sequence numbers locks the family row until the insert
    // commits, so two posts at once queue rather than collide.
    return sql.begin(async (tx) => {
      const [claim] = await tx`
        update relay.families set seq = seq + ${bodies.length}, bytes = bytes + ${bytes}
        where id = ${id} and ${device} = any (devices) and bytes + ${bytes} <= ${maxBytes}
        returning seq`
      if (!claim) {
        const [row] = await tx`select ${device} = any (devices) as member from relay.families where id = ${id}`
        return row?.member ? ('full' as const) : ('not_a_member' as const)
      }
      const last = Number(claim.seq)
      const first = last - bodies.length + 1
      await tx`
        insert into relay.ops ${tx(bodies.map((body, i) => ({ family_id: id, seq: first + i, device, body })))}`
      return last
    })
  },

  async listOps(id, after, limit) {
    const rows = await sql`
      select seq, device, body from relay.ops
      where family_id = ${id} and seq > ${after}
      order by seq limit ${limit}`
    return rows.map((row) => ({ seq: Number(row.seq), device: row.device, body: row.body }))
  },
}

Deno.serve((request) => {
  // Inside the function the path is /relay/v1/…; the handler expects /v1/….
  const url = new URL(request.url)
  const at = url.pathname.indexOf('/v1/')
  url.pathname = at === -1 ? url.pathname : url.pathname.slice(at)
  return handle(new Request(url, request), store)
})
