# Twohomes — marketing site

A single static page: `index.html`, `styles.css`, `app.js`. No build step, no
dependencies. Any static host will serve it; the only runtime fetch is
`stats.json`, which needs the page to be served over http (opened straight off
the disk, the counters fall back to the values in `app.js`).

Run it locally:

```bash
npx vite site --port 5190
```

## Hosting

`.github/workflows/deploy-site.yml` deploys `site/` on every push to `main`
that touches it. It smoke-tests the folder first — every file present, every
reference resolving, `app.js` parsing, no third-party CDN — so a half-broken
page never reaches the live site. A deploy is a static upload to a CDN: there
is no server to keep running, nothing to restart, and nothing to patch.

Pick a target with the repository variable `DEPLOY_TARGET`
(Settings → Secrets and variables → Actions → Variables):

### Cloudflare Pages — works while `twohomes` stays private

1. Create a free Cloudflare account, then **Workers & Pages → Create → Pages**,
   and make a project called `twohomes` (no build command, output directory
   `site`).
2. **My Profile → API Tokens → Create Token**, template *Edit Cloudflare
   Workers*, or a custom token with `Cloudflare Pages: Edit`.
3. In this repository add the secrets `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID` (the account ID is in the Cloudflare sidebar), and
   set the variable `DEPLOY_TARGET` to `cloudflare`.
4. Push. The site lands on `twohomes.pages.dev`, and a custom domain can be
   attached in the Cloudflare dashboard.

Cloudflare can also watch the repository itself, without Actions. Deploying
from the workflow instead keeps one pipeline, with the smoke test in front of
it.

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
