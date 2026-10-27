/**
 * The relay for local development: `npm run relay`.
 *
 * Node's http server around the same handler production runs, with the
 * in-memory store saved to relay/data/ after each write, so a restart keeps
 * the families. Not for production: one process, files on local disk.
 */
import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { handle, memoryStore } from '../supabase/functions/relay/relay.mjs'

const PORT = Number(process.env.PORT ?? 8787)
const DATA = join(import.meta.dirname, 'data')
const FILE = join(DATA, 'relay.json')
await mkdir(DATA, { recursive: true })

const store = memoryStore()
try {
  const saved = JSON.parse(await readFile(FILE, 'utf8'))
  for (const [id, family] of saved.families) store.families.set(id, family)
  for (const [id, log] of saved.logs) store.logs.set(id, log)
} catch {
  // First run.
}

const save = () =>
  writeFile(FILE, JSON.stringify({ families: [...store.families], logs: [...store.logs] }))

// Requests are handled one at a time, so a family's sequence numbers never race.
let queue = Promise.resolve()

createServer((req, res) => {
  queue = queue
    .then(async () => {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const body = ['GET', 'HEAD', 'OPTIONS'].includes(req.method ?? '') ? undefined : Buffer.concat(chunks)
      const request = new Request(`http://localhost:${PORT}${req.url}`, {
        method: req.method,
        headers: /** @type {Record<string, string>} */ (req.headers),
        body,
      })
      const response = await handle(request, store)
      if (req.method !== 'GET' && req.method !== 'OPTIONS') await save()
      res.writeHead(response.status, Object.fromEntries(response.headers))
      res.end(Buffer.from(await response.arrayBuffer()))
    })
    .catch((error) => {
      console.error(error)
      res.writeHead(500)
      res.end()
    })
}).listen(PORT, () => console.log(`Twohomes relay on http://localhost:${PORT}`))
