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

Each block is labelled once, with the home and the dates the stay spans — *Marek,
26–27*. A fortnight on a 320px phone leaves about 19px per day, far too little for a
numeral on every one, and labelling the stay rather than the day is truer to the idea
anyway.

**Two homes, two colours, equal weight.** Ochre and baltic blue — muted earth against
muted sea, warm against cool, so they separate instantly and neither is the "good"
colour or the alert colour. Which parent gets which is arbitrary and fixed; the colour
then holds everywhere, from calendar days to the balance figure. Deliberately not a
terracotta: sand plus clay is the commonest generated-page signature there is, and the
brief asked for the sand, not the clay.

**Chalk and sand, no shadows anywhere.** Scandinavian minimalism: depth comes from
space, not elevation, and there are no cards — a hairline marks where one thing ends and
the next begins. Dark mode is the same room after dark (winter dusk, warm charcoal)
rather than an inversion of the light one.

**One typeface, worked across its width axis.** Archivo carries a real `wdth` axis, so
hierarchy is set by width as much as by size: headings run at `wdth 120`, everything
else sits at 100 and stays quiet.

**Every change is attributed.** Moving a day records who moved it, and Today carries a
plain chronological list of what has changed since the plan was set — moves, requests,
agreements, refusals — in neutral past tense. On the calendar, a day moved off the
pattern carries a hollow dot. Nobody should have to ask "did you change Thursday?"

**One moment of motion:** the ribbon wipes in once on Today. Everything else moves only
in response to a tap, and all of it is off under `prefers-reduced-motion`.

**The copy is flat on purpose.** No "your ex", no blame, no streaks or scores on
parenting. Both parents may read every screen, so every screen is written as if both
are reading it. The hero is a sentence — *"They're with Jonas until Wednesday at
16:00"* — because that is the answer, and a stat tile is not.

## Not included

No accounts, no sync, no notifications, no file uploads, no court-admissible message
log. Twohomes is a planning tool, not legal advice, and it does not decide anything.
