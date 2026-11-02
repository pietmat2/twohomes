# Twohomes — marketing site

A single static page: `index.html`, `styles.css`, `app.js`. No build step, no
dependencies. Any static host will serve it; the only runtime fetch is
`stats.json`, which needs the page to be served over http (opened straight off
the disk, the counters fall back to the values in `app.js`).

Run it locally:

```bash
npx vite site --port 5190
```

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
