/*
 * Runs supabase/functions/site/index.ts in Node, without deploying it.
 *
 *   node scripts/test-site-function.mjs
 *
 * The function is Deno code, so this stubs Deno.serve to capture the handler,
 * strips the few type annotations Node cannot parse, and then asks it for every
 * asset — checking status, content type and that the bytes coming back are the
 * ones in site/. It is the difference between "the bundle contains the site"
 * and "the function serves the site".
 */

import { readFileSync } from 'node:fs';

const SRC = 'supabase/functions/site/index.ts';
const ORIGIN = 'https://aqkxpauandobwvjymxyl.supabase.co';
const BASE = '/functions/v1/site';

const js = readFileSync(SRC, 'utf8')
  .replace(/^type Asset = .*$/m, '')
  .replace('const ASSETS: Record<string, Asset> =', 'const ASSETS =')
  .replace('(req: Request)', '(req)')
  .replace(/const bytes = \(b64: string\)/, 'const bytes = (b64)');

let handler;
globalThis.Deno = { serve: (fn) => (handler = fn) };
await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

if (typeof handler !== 'function') {
  console.error('the function never called Deno.serve');
  process.exit(1);
}

const cases = [
  ['/', 'index.html', 'text/html; charset=utf-8'],
  ['/styles.css', 'styles.css', 'text/css; charset=utf-8'],
  ['/app.js', 'app.js', 'text/javascript; charset=utf-8'],
  ['/stats.json', 'stats.json', 'application/json; charset=utf-8'],
  ['/favicon.svg', 'favicon.svg', 'image/svg+xml'],
  ['/fonts/figtree-latin-wght-normal.woff2', 'fonts/figtree-latin-wght-normal.woff2', 'font/woff2'],
  [
    '/fonts/figtree-latin-ext-wght-normal.woff2',
    'fonts/figtree-latin-ext-wght-normal.woff2',
    'font/woff2',
  ],
];

let failed = 0;
const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  failed += 1;
};

for (const [path, file, type] of cases) {
  const res = await handler(new Request(ORIGIN + BASE + path));
  const body = Buffer.from(await res.arrayBuffer());
  const want = readFileSync(`site/${file}`);

  if (res.status !== 200) fail(`${path} answered ${res.status}`);
  else if (res.headers.get('content-type') !== type)
    fail(`${path} served as ${res.headers.get('content-type')}, wanted ${type}`);
  else if (!body.equals(want)) fail(`${path} body differs from site/${file}`);
  else console.log(`ok    ${path.padEnd(42)} ${body.length}B  ${type}`);
}

/* Without the trailing slash the page's relative links would resolve one level
   too high, so the function has to redirect first. */
const redirect = await handler(new Request(ORIGIN + BASE));
if (redirect.status !== 301 || !redirect.headers.get('location')?.endsWith(`${BASE}/`))
  fail(`no redirect to ${BASE}/ (got ${redirect.status} ${redirect.headers.get('location')})`);
else console.log(`ok    ${BASE} redirects to ${BASE}/`);

/* The short path the function also answers on. */
const short = await handler(new Request(`${ORIGIN}/site/`));
if (short.status !== 200) fail(`/site/ answered ${short.status}`);
else console.log('ok    /site/ serves the page too');

const missing = await handler(new Request(`${ORIGIN}${BASE}/nope.css`));
if (missing.status !== 404) fail(`an unknown path answered ${missing.status}, wanted 404`);
else console.log('ok    an unknown path is a 404');

const head = await handler(new Request(ORIGIN + BASE + '/', { method: 'HEAD' }));
if (head.status !== 200 || (await head.text()) !== '') fail('HEAD returned a body');
else console.log('ok    HEAD returns headers only');

console.log(
  failed ? `\n${failed} check(s) failed` : '\nthe function serves site/ correctly on every path'
);
process.exit(failed ? 1 : 0);
