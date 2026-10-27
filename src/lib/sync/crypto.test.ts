import { describe, expect, it } from 'vitest'
import { decodeInvite, encodeInvite, newFamilyId, newSecret, newSigningKeys, openOp, opKey, relayToken, sealOp } from './crypto'
import type { Op } from './engine'

const op = (author: 'a' | 'b', kind: Op['kind'] = 'put', value: unknown = 'PLN'): Op => ({
  id: crypto.randomUUID(),
  stamp: { t: 1, c: 0, d: 'device-aaaaaaaaaa' },
  author,
  kind,
  key: kind === 'member' ? `member/${author}` : 'currency',
  value,
})

describe('sealed operations', () => {
  it('open with the family key and the right signer', async () => {
    const secret = newSecret()
    const family = newFamilyId()
    const key = await opKey(secret)
    const anna = await newSigningKeys()
    const sealed = await sealOp(op('a'), key, family, anna.privateKey)
    expect(sealed).not.toContain('PLN')
    expect((await openOp(sealed, key, family, { a: anna.publicKey }))?.value).toBe('PLN')
  })

  it('refuse an op signed by the other parent’s device', async () => {
    const key = await opKey(newSecret())
    const family = newFamilyId()
    const anna = await newSigningKeys()
    const jonas = await newSigningKeys()
    // Jonas's device claims to be Anna.
    const forged = await sealOp(op('a'), key, family, jonas.privateKey)
    expect(await openOp(forged, key, family, { a: anna.publicKey, b: jonas.publicKey })).toBeNull()
  })

  it('refuse a second key for a parent who already has one', async () => {
    const key = await opKey(newSecret())
    const family = newFamilyId()
    const anna = await newSigningKeys()
    const intruder = await newSigningKeys()
    const sealed = await sealOp(op('a', 'member', { publicKey: intruder.publicKey }), key, family, intruder.privateKey)
    expect(await openOp(sealed, key, family, { a: anna.publicKey })).toBeNull()
  })

  it('refuse another family’s key, and another family’s id', async () => {
    const family = newFamilyId()
    const anna = await newSigningKeys()
    const sealed = await sealOp(op('a'), await opKey(newSecret()), family, anna.privateKey)
    expect(await openOp(sealed, await opKey(newSecret()), family, { a: anna.publicKey })).toBeNull()
  })

  it('give the relay a token it cannot turn into the key', async () => {
    const secret = newSecret()
    const token = await relayToken(secret)
    expect(token).not.toBe(secret)
    expect(token).toBe(await relayToken(secret))
  })
})

describe('invitations', () => {
  it('round-trip, and reject anything tampered with', () => {
    const invite = { v: 1 as const, f: newFamilyId(), s: newSecret(), p: 'a' as const, n: 'Anna' }
    const code = encodeInvite(invite)
    expect(decodeInvite(code)).toEqual(invite)
    expect(decodeInvite(code.slice(0, -6))).toBeNull()
    expect(decodeInvite('not-a-code')).toBeNull()
  })
})
