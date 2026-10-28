# Twohomes

A calm shared calendar and expense ledger for separated parents.

One child, two homes, one plan. Twohomes answers the questions that cause most of the
friction between separated parents — *who has them tonight*, *who is paying for the
boots*, *who is taking them to the dentist* — without either parent having to ask the
other.

## What it does

| Screen       | What it is for                                                                    |
| ------------ | --------------------------------------------------------------------------------- |
| **Today**    | Who has the children right now, the next changeover, anything waiting on you.      |
| **Calendar** | A month of custody days, tap any day to reassign it or ask the other home to swap. |
| **Money**    | Shared costs, who owes who, and a ledger that both sides can audit.                |
| **Moments**  | A photo and a line from whichever home they are in, plus a weekly activity idea.   |
| **Kids**     | Allergies, school, doctor, and the list of things that travel between homes.       |

### Custody patterns

Seven built-in rotations plus a fully manual mode:

`week on / week off` · `2-2-3` · `2-2-5-5` · `3-4-4-3` · `5-2-2-5` · `two on / two off`
· `every other weekend` · `custom`

A pattern is a repeating cycle anchored to one date. Any individual day can be
overridden by hand, and overrides always win — so the pattern describes the agreement
while real life stays editable.

### School holidays

Pick a country in Settings and the calendar shows its school breaks and public holidays:
a dash under days off school, an underline on public holidays, and a list for the month.
Today lists breaks under way or starting in the next three weeks, when the two homes most
need to have agreed who has the children. The choice is shared by both homes.

- **Denmark:** Københavns Kommune's guide plan for 2026/27 and 2027/28, with winter break
  in week 7 or week 8, since municipalities split between the two.
- **Poland:** the Ministry of Education's dates, with winter break by voivodeship for
  2026/27 and 2027/28.

Public holidays are computed from the date of Easter, so they work for any year. School
breaks come from published tables (`src/lib/holidays.ts`, with sources) and stop where the
tables do; extend them each spring when the next year is announced.

### Swap requests

Asking for a day does not take it. A request sits as pending until the other home
accepts, and only then does the calendar move. Declining leaves everything as it was.
This is deliberate: the app should never be the thing that creates a dispute.

### The money model

Every expense records who paid, the split, and who it was for. The balance is derived,
never stored:

```
balance = Σ (what the other home owes on each expense) − Σ (payments already made)
```

Payments are ledger entries of their own, so the history stays auditable and nothing is
silently marked "settled". Twohomes records money that moved; it never moves money.

## Running it

```bash
npm install
npm run dev
```

Then open the URL it prints. `npm run build` produces a static `dist/`, and `npm test`
runs the tests.

To try sharing between two homes locally, run the relay in a second terminal:

```bash
npm run relay
```

The dev server talks to it at `http://localhost:8787`. Production builds use the hosted
relay named in `.env.production`; a build with no `VITE_RELAY_URL` switches sharing off
and makes no connections at all.

### The hosted relay

A Supabase Edge Function in Frankfurt (project `twohomes-relay`, Free plan), with its
tables in a private `relay` schema. The function is `supabase/functions/relay/`: its
`relay.mjs` is the same handler the local relay runs. To redeploy after changing it:

```bash
npx supabase functions deploy relay --project-ref aqkxpauandobwvjymxyl --no-verify-jwt
```

JWT verification stays off: requests carry the family's relay token, which the handler
checks itself. The schema is `supabase/migrations/`.

Free-plan limits worth knowing: the project **pauses after about a week without
activity** (resume it from the dashboard; the app shows "the relay could not be reached"
until then), 500,000 function calls a month, and a 500 MB database. The relay caps each
family at 25 MB and the whole relay at 5,000 families.

## Hosting

The build is a plain static bundle with a relative base path and hash-based routing, so
it deploys anywhere with no rewrite rules or server config:

```bash
npm run build
# then drop dist/ on Vercel, Netlify, Cloudflare Pages, GitHub Pages or any bucket
```

## Languages

English, Danish and Polish, picked from the browser on first open and changeable in
Settings. There is no i18n library: `src/lib/messages/en.ts` is the source catalogue and
the others are typed `Record<MessageKey, Message>`, so **a missing or stale translation
is a compile error**, not a blank label.

Three things that are easy to get wrong and are handled here:

- **Plurals.** Chosen with `Intl.PluralRules`, because Polish needs three forms —
  1 noc, 2 noce, 5 nocy — where English and Danish need two. A sentence holding two
  different counts formats each phrase separately (`common.nights`) rather than trying
  to interpolate two plurals into one template.
- **Declension.** Parent names are user-entered and cannot be inflected, so no Polish
  string puts one after a preposition. They sit in a parenthesis, after a colon or
  before a dash, where Polish takes the nominative — *"Do oddania (Marek): 250,00 zł"*.
  The same trick keeps weekdays grammatical: *"Na termin: środa"*, never *"do środa"*.
- **Gender.** The app does not know whether the reader is a mother or a father, so the
  Polish catalogue avoids gendered past-tense verbs entirely — *"Zapłacone przez
  Ciebie"*, not *"Zapłaciłeś/Zapłaciłaś"*.

Dates use the matching date-fns locale, including Polish's distinction between the
standalone month (`LLLL` → *październik 2026*) and the genitive used inside a date
(`MMMM` → *26 października*). Lists join through `Intl.ListFormat`, so *"Mila and
Oscar"* becomes *"Mila i Oscar"*. `<html lang>` follows the setting.

Currency is deliberately **independent** of language: a Polish speaker living in Denmark
pays in DKK. The demo data is localised too, so a first open does not show *Winter boots*
to a Polish reader.

To add a language: add `src/lib/messages/<code>.ts` typed as `Catalogue`, register it in
`src/lib/i18n.ts` and `src/lib/i18n-locale.ts`, and add its demo content in `seed.ts`.
TypeScript will list every string you still owe.

## Where the data lives

**On the device. Nothing is uploaded anywhere.** In a browser that is `localStorage`; in
the native apps, Capacitor Preferences. Photos are downscaled to roughly 900px, stripped
of their location and camera details, and stored as JPEG data URLs inside the same
record.

Set a passcode in Settings and all of it is encrypted at rest, with a key only that
passcode opens; exports are then encrypted too. [SECURITY.md](SECURITY.md) covers what
is held, the threats, and what answers each. [PRODUCT.md](PRODUCT.md) covers which
features earn their place, and what stands between this build and an MVP.

**Sharing between the two homes** is end-to-end encrypted. One parent invites the other
from Settings; from then on every change is signed by the device that made it,
encrypted, and passed through a relay that stores only sealed parcels. A device belongs
to one parent; there is deliberately no way to act as the other one. Export and import
in Settings still move a full copy between your own devices.

Making it genuinely shared is the first real engineering task — see
[BUSINESS.md](BUSINESS.md#what-has-to-be-built-before-anyone-pays) for what that
involves and why the current shape was chosen first.

## Project layout

```
src/
  lib/
    types.ts      domain model
    schedule.ts   custody patterns, overrides, handovers, night counts
    money.ts      balance, splits, category totals, amount parsing
    storage.ts    persistence, migration, photo downscaling, export/import
    vault.ts      encryption at rest: passcode-wrapped AES-GCM data key
    sanitize.ts   validation for anything imported
    SecurityProvider.tsx  lock screen, auto-lock, encrypted saves
    sync/         two homes in step: operations, merge, signing, the relay client
relay/            the relay for local development, and its tests
supabase/         the hosted relay: Edge Function and schema
    store.tsx     single state tree, all mutations, display-name helper
    seed.ts       demo data, generated relative to today
    format.ts     dates, names, ages
  components/     ui kit (Card, Button, Sheet, Segmented) and icons
  pages/          Today, Calendar, Expenses, Moments, Kids, Settings
```

State is one object with every mutation routed through `store.tsx`, which makes the
swap to a real backend a change in one file rather than a rewrite.

## Design notes

The look is **Flow**, from a Claude Design prototype (`Twohomes Flow.html`): soft pastel
fields on a warm grey ground, heavy type, and everything rounded into pills.

**Colour is the answer.** Lime is you, cyan is the other home — on each parent's own
phone, so both of them see their own days in lime. The month reads at a glance before a
single number does. Pages only ever say `home-a` and `home-b`; `data-me` on `<html>`
re-points those two at lime and cyan (`src/index.css`). Pink belongs to money, sand to
what is coming up.

**One thing at a time.** Today answers the question in two lines — *"With Jonas / till
tomorrow"* — then stacks everything that needs you as cards: a swap to answer, a bag
to pack, a cost to settle, an event, this week's note on what helps children. Answer
the top card and the next one rises; when the stack is empty, you're done for the day.
Putting a card away is remembered per device and never synced.

**The ribbon is the fortnight.** Parents describe custody in stays, not days, so
consecutive days in one home fuse into one pill, as long as the stay. Week-on/week-off
reads as two long bars, 2-2-3 as a stutter. The stay holding today is ringed; each pill
names itself to a screen reader.

**Weight, not width.** Figtree, bundled with the app (the prototype names Proxima Nova,
a paid Adobe font; Figtree is its own fallback). Screen titles run at 900 weight with
tight tracking, eased down from 52px so *"Październik"* still fits at 320px.

**Rounded and soft.** Pill buttons, 30px surfaces, 14px day tiles, a floating pill
nav with words instead of icons. The hug mark — one thick line drawn just off the
ground colour — sits behind Today, the calendar and money. Three themes: Default (warm
grey), Light and Dark; System picks Default by day and Dark by night.

**Every change is attributed.** Moving a day records who moved it, and Today carries a
plain chronological list of what has changed since the plan was set — moves, requests,
agreements, refusals — in neutral past tense. On the calendar, a day moved off the
pattern carries a hollow dot. Nobody should have to ask "did you change Thursday?"

**Motion only where it means something:** the ribbon wipes in once on Today, and an
answered card slides away so the next can rise. Everything else moves only in response
to a tap, and all of it is off under `prefers-reduced-motion`.

**The copy is flat on purpose.** No "your ex", no blame, no streaks or scores on
parenting. Both parents may read every screen, so every screen is written as if both
are reading it. The hero is a sentence — *"With Jonas till Wednesday"* — because that
is the answer, and a stat tile is not. For the same reason the money card offers to
record a payment, not to "send a reminder": a nudge to pay is a message, and messages
are where arguments start.

## Not included

No accounts, no notifications, no file uploads, no court-admissible message log. Twohomes is a planning tool, not legal advice, and it does not decide anything.
