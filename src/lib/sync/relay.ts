/**
 * Talking to the relay. Every call carries the family's token; nothing sent
 * is readable without the family's key, which the relay never sees.
 */

/** Set at build time. Unset in a production build means sharing is off. */
export const RELAY_URL: string =
  import.meta.env.VITE_RELAY_URL ?? (import.meta.env.DEV ? 'http://localhost:8787' : '')

export class RelayError extends Error {
  status: number
  code: string
  constructor(status: number, code: string) {
    super(`relay ${status} ${code}`)
    this.name = 'RelayError'
    this.status = status
    this.code = code
  }
}

async function call<T>(method: string, path: string, token: string, body?: unknown): Promise<T> {
  const response = await fetch(`${RELAY_URL}/v1/${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    // The relay is another origin; nothing ambient should go with the request.
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  })
  if (response.status === 204) return undefined as T
  const json = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) throw new RelayError(response.status, json.error ?? 'unknown')
  return json
}

export function openFamily(familyId: string, token: string) {
  return call<{ created: boolean }>('PUT', `families/${familyId}`, token)
}

/** Throws RelayError with code `full` when both homes already have a device. */
export function joinFamily(familyId: string, token: string, device: string) {
  return call<{ joined: boolean }>('POST', `families/${familyId}/devices`, token, { device })
}

export function leaveFamily(familyId: string, token: string, device: string) {
  return call<void>('DELETE', `families/${familyId}/devices/${device}`, token)
}

export function postOps(familyId: string, token: string, device: string, ops: string[]) {
  return call<{ last: number }>('POST', `families/${familyId}/ops`, token, { device, ops })
}

export function getOps(familyId: string, token: string, after: number) {
  return call<{ ops: { seq: number; device: string; body: string }[]; last: number }>(
    'GET',
    `families/${familyId}/ops?after=${after}`,
    token,
  )
}
