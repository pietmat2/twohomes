import { describe, expect, it } from 'vitest'
import { handle, memoryStore } from '../supabase/functions/relay/relay.mjs'

const FAMILY = 'family-0123456789abcdef'
const call = (store, method, path, token, body) =>
  handle(
    new Request(`http://relay/v1/${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }),
    store,
  )

describe('relay', () => {
  it('keeps a family to its token', async () => {
    const store = memoryStore()
    expect((await call(store, 'PUT', `families/${FAMILY}`, 'right')).status).toBe(201)
    expect((await call(store, 'PUT', `families/${FAMILY}`, 'right')).status).toBe(200)
    expect((await call(store, 'PUT', `families/${FAMILY}`, 'wrong')).status).toBe(401)
    expect((await call(store, 'GET', `families/${FAMILY}/ops?after=0`, 'wrong')).status).toBe(401)
  })

  it('admits two devices and no third', async () => {
    const store = memoryStore()
    await call(store, 'PUT', `families/${FAMILY}`, 't')
    expect((await call(store, 'POST', `families/${FAMILY}/devices`, 't', { device: 'device-aaaaaaaaaaaa' })).status).toBe(201)
    expect((await call(store, 'POST', `families/${FAMILY}/devices`, 't', { device: 'device-bbbbbbbbbbbb' })).status).toBe(201)
    expect((await call(store, 'POST', `families/${FAMILY}/devices`, 't', { device: 'device-cccccccccccc' })).status).toBe(409)
    // Leaving frees the slot.
    await call(store, 'DELETE', `families/${FAMILY}/devices/device-bbbbbbbbbbbb`, 't')
    expect((await call(store, 'POST', `families/${FAMILY}/devices`, 't', { device: 'device-cccccccccccc' })).status).toBe(201)
  })

  it('stores ops in order and only from members', async () => {
    const store = memoryStore()
    await call(store, 'PUT', `families/${FAMILY}`, 't')
    await call(store, 'POST', `families/${FAMILY}/devices`, 't', { device: 'device-aaaaaaaaaaaa' })
    expect((await call(store, 'POST', `families/${FAMILY}/ops`, 't', { device: 'device-zzzzzzzzzzzz', ops: ['x'] })).status).toBe(403)
    await call(store, 'POST', `families/${FAMILY}/ops`, 't', { device: 'device-aaaaaaaaaaaa', ops: ['one', 'two'] })
    await call(store, 'POST', `families/${FAMILY}/ops`, 't', { device: 'device-aaaaaaaaaaaa', ops: ['three'] })
    const page = await (await call(store, 'GET', `families/${FAMILY}/ops?after=1`, 't')).json()
    expect(page.ops.map((op) => [op.seq, op.body])).toEqual([[2, 'two'], [3, 'three']])
    expect(page.last).toBe(3)
  })
})
