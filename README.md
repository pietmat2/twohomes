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

Then open the URL it prints. `npm run build` produces a static `dist/`.

## Hosting

The build is a plain static bundle with a relative base path and hash-based routing, so
it deploys anywhere with no rewrite rules or server config:

```bash
npm run build
# then drop dist/ on Vercel, Netlify, Cloudflare Pages, GitHub Pages or any bucket
```

## Where the data lives

**On the device, in `localStorage`. Nothing is uploaded anywhere.** That includes
photos, which are downscaled to roughly 900px and stored as JPEG data URLs inside the
same blob.

This is the honest limitation of the current build: it is a complete, usable
single-player app, and the two-player half is simulated by switching sides in Settings.
Export and import in Settings move a full copy between devices.

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
    store.tsx     single state tree, all mutations, display-name helper
    seed.ts       demo data, generated relative to today
    format.ts     dates, names, ages
  components/     ui kit (Card, Button, Sheet, Segmented) and icons
  pages/          Today, Calendar, Expenses, Moments, Kids, Settings
```

State is one object with every mutation routed through `store.tsx`, which makes the
swap to a real backend a change in one file rather than a rewrite.

## Design notes

**The ribbon is the idea.** Parents describe custody in stays, not days — *"I have them
Monday and Tuesday, he has Wednesday and Thursday, then I get the long weekend."* So
consecutive days in the same home fuse into one block, rounded only where a stay
actually begins and ends. A stay that runs past Sunday stays square on that edge and
picks up again on the next row. The shape carries the information: week-on/week-off
reads as two long bars, 2-2-3 as a stutter. You can see the rhythm of an arrangement
before reading a single number.

**Two homes, two colours, equal weight.** Amber and mint — warm against cool, so they
separate instantly, and neither is the "good" colour or the alert colour. Which parent
gets which is arbitrary and fixed; the colour then holds everywhere, from calendar days
to the balance figure.

**A dark ground, not cream.** This app is opened at 22:00 by someone checking tomorrow's
handover. Faustina carries dates, names and amounts; Figtree carries the interface.

**One moment of motion:** the ribbon wipes in once on Today. Everything else moves only
in response to a tap, and all of it is off under `prefers-reduced-motion`.

**The copy is flat on purpose.** No "your ex", no blame, no streaks or scores on
parenting. Both parents may read every screen, so every screen is written as if both
are reading it. The hero is a sentence — *"They're with Jonas until Wednesday at
16:00"* — because that is the answer, and a stat tile is not.

## Not included

No accounts, no sync, no notifications, no file uploads, no court-admissible message
log. Twohomes is a planning tool, not legal advice, and it does not decide anything.
