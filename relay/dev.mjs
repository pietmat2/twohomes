/**
 * The relay for local development: `npm run relay`.
 *
 * Node's http server around the same handler production would run, with a
 * file store under relay/data/ so a restart doesn't lose the families.
 * Not for production: one process, no backups, files on local disk.
 */
import { createServer } from 'node:http'
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { handle } from './relay.mjs'

const PORT = Number(process.env.PORT ?? 8787)
const DATA = join(import.meta.dirname, 'data')
await mkdir(DATA, { recursive: true })

/** @type {import('./relay.mjs').Store} */
const fileStore = {
  async getFamily(id) {
    try {
      return JSON.parse(await readFile(join(DATA, `${id}.json`), 'utf8'))
    } catch {
      return null
    }
  },
  async putFamily(id, family) {
    await writeFile(join(DATA, `${id}.json`), JSON.stringify(family))
  },
  async appendOps(id, ops) {
    await appendFile(join(DATA, `${id}.ops.jsonl`), ops.map((op) => JSON.stringify(op) + '\n').join(''))
  },
  async listOps(id, after, limit) {
    let text = ''
    try {
      text = await readFile(join(DATA, `${id}.ops.jsonl`), 'utf8')
    } catch {
      return []
    }
    const out = []
    for (const line of text.split('\n')) {
      if (!line) continue
      const op = JSON.parse(line)
      if (op.seq > after) out.push(op)
      if (out.length >= limit) break
    }
    return out
  },
}

// Requests are handled one at a time, so a family's sequence numbers never race.
let queue = Promise.resolve()

createServer((req, res) => {
  queue = queue.then(async () => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = ['GET', 'HEAD', 'OPTIONS'].includes(req.method ?? '') ? undefined : Buffer.concat(chunks)
    const request = new Request(`http://localhost:${PORT}${req.url}`, {
      method: req.method,
      headers: /** @type {Record<string, string>} */ (req.headers),
      body,
    })
    const response = await handle(request, fileStore)
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(Buffer.from(await response.arrayBuffer()))
  }).catch((error) => {
    console.error(error)
    res.writeHead(500)
    res.end()
  })
}).listen(PORT, () => console.log(`Twohomes relay on http://localhost:${PORT}`))
