# Twohomes — marketing site

A single static page: `index.html`, `styles.css`, `app.js`. No build step, no
dependencies. Any static host will serve it; the only runtime fetch is
`stats.json`, which needs the page to be served over http (opened straight off
the disk, the counters fall back to the values in `app.js`).

Run it locally:

```bash
npx vite site --port 5190
```

## Photos

`images/` holds stock photos from [Pexels](https://www.pexels.com/license/), free
for commercial use, converted to WebP. Pexels does not guarantee model releases,
and the page sits beside copy about separated parents, so replace them with
photos taken with the parents' written consent before a wider launch. Sources,
as `https://www.pexels.com/photo/<id>/`:

| File | Pexels id |
| --- | --- |
| `hero-dad.webp` | 29091721 |
| `hero-mum.webp` | 11106579 |
| `why-path.webp` | 207697 |
| `today.webp` | 12960435 |
| `calendar.webp` | 4543660 |
| `money.webp` | 4814877 |
| `moments.webp` | 2965017 |
| `kids.webp` | 4172983 |
| `about.webp` | 6297628 |
| `contact.webp` | 4149006 |

`images/screens/<lang>/` are real screens of the app with the demo family, and
`video/twohomes-demo.mp4` and `video/twohomes-demo-da.mp4` are the demo films. Recapture
them when the app changes. The films are not in the Supabase bundle.

## Hosting

`.github/workflows/deploy-site.yml` deploys `site/` on every push to `main`
that touches it. It smoke-tests the folder first — every file present, every
reference resolving, `app.js` parsing, no third-party CDN — so a half-broken
page never reaches the live site. A deploy is a static upload to a CDN: there
is no server to keep running, nothing to restart, and nothing to patch.

Pick a target with the repository variable `DEPLOY_TARGET`
(Settings → Secrets and variables → Actions → Variables):

### Supabase — deployed, and it does not work. Do not retry.

Tried on 2026-11-02 and ruled out by the live deploy. Supabase rewrites HTML
served from `*.supabase.co/functions/v1/*`:

```
Content-Type: text/plain                     ← the function's text/html, overridden
Content-Security-Policy: default-src 'none'; sandbox
```

So the page arrives as raw source, and the CSP would block every stylesheet,
script and font even if it rendered. CSS, JS, JSON and fonts keep their real
types — only the HTML document is neutered, which is an anti-abuse measure, not
a bug to work around. Storage is not an alternative either: the project has no
buckets, and the CLI cannot create one.

The function below is still deployed (`site`, verify_jwt off) and harmless; it
can be removed with `npx supabase functions delete site`. Keep it only if you
later attach a Supabase custom domain and confirm the rewrite does not apply
there.

`twohomes-relay` (eu-central-1) already serves the relay as an Edge Function.
`scripts/build-site-function.mjs` packs `site/` into a second one, which serves
the whole page — HTML, CSS, JS, fonts and `stats.json` — out of its own bundle,
so a deploy is atomic and there is no bucket to configure. Deploy it the same
way the relay is deployed:

```bash
npm run site:deploy
```

That packs `site/` into the function, runs the function in Node and asks it for
every asset (status, content type, bytes), and only then deploys. `npm run
site:build` does the first two on their own.

It then answers at
`https://aqkxpauandobwvjymxyl.supabase.co/functions/v1/site/` — public, no JWT,
and a custom domain can be put in front of it. For CI instead of a laptop, set
the variable `DEPLOY_TARGET` to `supabase` and add a `SUPABASE_ACCESS_TOKEN`
secret; the workflow rebuilds the bundle, deploys, and then fetches the page to
confirm it answers 200 before the run goes green.

Worth knowing: this serves a static page from a function, which is slightly
unusual — it costs an invocation per request rather than a pure CDN hit. At
marketing-site traffic that is immaterial, and it buys a deploy that needs no
new account and no change of repository visibility.

### Cloudflare Pages — the recommended host, and it keeps `twohomes` private

Three things to set up once. The workflow creates the Pages project itself, so
there is nothing to click in the dashboard beyond the token.

1. **Account.** A free account at `dash.cloudflare.com`. Copy the **Account ID**
   from the right-hand sidebar of the dashboard home.
2. **Token.** *My Profile → API Tokens → Create Token*, template **Edit
   Cloudflare Workers** (it covers Pages), or a custom token with
   `Account · Cloudflare Pages · Edit`. Copy it once — it is shown only then.
3. **Repository.** *Settings → Secrets and variables → Actions*:
   - secret `CLOUDFLARE_API_TOKEN` — the token from step 2
   - secret `CLOUDFLARE_ACCOUNT_ID` — the ID from step 1
   - variable `DEPLOY_TARGET` = `cloudflare` (the **Variables** tab, not Secrets)

Then run the workflow — push anything under `site/`, or *Actions → Deploy site →
Run workflow*. It creates the `twohomes` project on the first run, uploads
`site/`, and then fetches `https://twohomes.pages.dev/` and fails the run unless
it answers **200 with `text/html`**. That last check exists because a host that
rewrites HTML to `text/plain` still answers 200 and is still not a website —
which is exactly how the Supabase attempt failed.

A custom domain can be attached later under *Workers & Pages → twohomes →
Custom domains*. Cloudflare can also watch the repository directly, without
Actions; deploying from the workflow keeps one pipeline with the smoke test in
front of it.

### GitHub Pages — needs the repository to be public

Leave `DEPLOY_TARGET` unset. Pages serves a **private** repository only on a
paid plan, so on the free plan the run stops at *Configure Pages* until either
the repository is public or the plan is upgraded. The workflow enables Pages by
itself the first time it succeeds; nothing to click.

If the app source should stay private, keep the site in a second, public
repository and point this workflow's deploy step at it — or use Cloudflare,
above, which has no such restriction.

## Before it goes public

Three things on this page are **placeholders**, marked in the source:

1. **The live counters.** `stats.json` ships as `0 / 0`, which the page renders
   honestly as "not yet". Put the real figures there — or point `LIVE_ENDPOINT`
   in `app.js` at an endpoint that returns the same three fields
   (`familiesHelped`, `activeUsers`, `updated`) and the page will read it every
   60 seconds. `stats.example.json` shows the shape. Do not ship invented
   numbers: a counter is a factual claim.
2. **The testimonials** in `#voices`. Every quote and name is invented sample
   copy, and the section carries a visible note saying so. Replace them with
   real, permissioned quotes and delete `.voices__disclaimer`.
3. **The founder paragraph** in `#about` (`about.lead`), which is drafted from
   the product's own story. Make it true or cut it.

Also check: the contact address (`CONTACT_EMAIL` in `app.js`, plus the two
`mailto:` links in `index.html`), "Designed in Denmark" in the footer, and the
status line "Private beta, 2026" in the About panel.

## How it is put together

- **Language.** English and Danish, switched by the EN/DA control in the header.
  All copy lives in the `COPY` dictionary in `app.js`, keyed by `data-i18n`
  attributes in the HTML; the English strings are also written into the HTML so
  the page reads correctly before JavaScript runs. The choice is remembered in
  `localStorage`, and a Danish browser gets Danish first. The Danish copy is
  mine, not a native speaker's — have it proofread.
- **Design.** The same tokens as the app (`src/index.css`): warm grey paper
  ground, white surfaces at 30px radius, Figtree 800 headlines, lime for one
  home and cyan for the other.
- **Motion.** Reveal on scroll, a rotating quote, and the count-up. All of it is
  switched off under `prefers-reduced-motion`.
- **The form** validates in the browser and then hands the message to the
  visitor's own mail client via `mailto:`. Nothing is posted anywhere, so there
  is no backend to secure and no data to store. If you would rather collect
  submissions, replace the `submit` handler in `app.js` with a `fetch` to your
  endpoint.
