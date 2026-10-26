# Twohomes as a business

An honest read on the idea, written to be argued with. Every number below is an order
of magnitude to verify before it goes in a pitch deck — none of it is researched data.

## The rating

**7/10.** A real, durable, painful problem with proven willingness to pay — in a market
that already has well-funded incumbents and one structural trap that kills most entrants.

| Dimension             | Score  | Why                                                                             |
| --------------------- | ------ | ------------------------------------------------------------------------------- |
| Problem is real       | 9      | Separated parents coordinate weekly, forever, usually badly, often in anger.     |
| Pain is recurring     | 9      | Not a one-off. Every week, for 10–18 years.                                      |
| Willingness to pay    | 7      | Proven: incumbents charge real money and courts sometimes mandate their use.     |
| Market size           | 6      | Large in absolute terms, but you reach it one couple at a time.                  |
| Competition           | 5      | OurFamilyWizard, TalkingParents, 2houses, AppClose, Coparently, Custody X Change.|
| Ease of distribution  | 4      | Nobody searches for this until a crisis, and nobody recommends it at dinner.     |
| **Adoption mechanics**| **3**  | **The hard part. See below.**                                                    |
| Defensibility         | 5      | Features copy easily. Switching cost and trust are the moats, and both take time.|
| Founder–market fit    | 9      | If the story is yours, it is the single strongest asset you have.                |

### What is genuinely good about it

- **The pain is structural, not seasonal.** It does not go away when the economy turns.
- **It is boring in the right way.** Calendars and ledgers are unglamorous, which is why
  the big consumer app companies leave the category alone.
- **Free entry is viable.** Unlike marketplaces, a single parent gets value on day one
  with no other user present. That is what the current build proves.
- **International by construction.** Custody patterns, currencies, and date formats are
  configuration, not code. The same product works in Denmark, Poland, Germany, the UK.
- **Emotionally defensible.** If the framing is "the kid is the user", every feature
  decision has a clear tiebreaker.

### What you are underestimating

**1. Both parents have to install it. This is the whole game.**

Your app is only fully useful when the person you separated from also signs up, keeps
it updated, and does not weaponise it. That is a two-sided adoption problem inside a
relationship that is, by definition, strained. Most co-parenting apps die here.

The mitigation is in the product, not the marketing: **make it fully useful for one
parent alone.** This build already does that — calendar, nights count, expense ledger,
bag list, kid info all work solo. Treat the second parent as an upgrade, not a
requirement. A one-way share link ("here is next month, read-only, no signup") converts
far better than "invite your ex to create an account".

**2. "People will forget how to build relationships because of AI" is not a thesis.**

Divorce rates have been roughly flat-to-declining across much of Europe for years, and
marriage rates are falling too. Do not build the pitch on a rising-tide claim you cannot
evidence. The honest pitch is stronger and simpler: *this problem already affects
millions of families, and the tools they use for it are bad or expensive.*

**3. Your most motivated users are your worst users.**

High-conflict separations generate the most engagement and the most support burden,
screenshots used in court, abuse reports, and demands that you take a side. Decide early
whether you serve high-conflict (documentation, tamper-evident logs, court exports —
this is what OurFamilyWizard monetises) or cooperative co-parents (speed, warmth, low
friction — what this build is designed for). They want opposite products. **Pick one.**
This build is cooperative-first, and I would stay there.

**4. Churn is built in.** Routines stabilise, kids grow up, people reconcile or stop
caring. Assume high churn and price for it. Annual plans matter more here than usual.

**5. Children's data is regulated data.** Photos of minors, health notes, and school
details, across two households, under GDPR. Local-first storage, as in this build, is
not just a shortcut — it is a defensible position worth keeping as long as you can.

## The friends' notes

**"Why only divorced parents?"** — Your friend is right that the problems overlap with
intact families, and right again that divorced parents are the sharper target. Do both,
in order: **wedge on separated parents, because they have no alternative and the pain is
acute; expand later to any two-household arrangement** — widowed parents, never-married
co-parents, shift workers, military families, grandparent carers, foster placements.
Nothing in the data model says "divorce", which is deliberate. But the landing page
should say it plainly, because vague positioning converts nobody.

**"Photos so the other parent can see"** — your friend called it a joke; it is the best
idea in the thread. It is the only feature here with an emotional pull rather than an
administrative one, it is what makes a parent open the app on a day they have no
logistics to check, and it is the natural free-tier hook with an obvious paid ceiling
(storage, video, grandparent access). It is built — see the Moments screen.

**"Challenges for spending time"** — handle with care. A weekly activity nudge is in the
build. Anything scored, streaked, or comparative between two homes turns the app into a
scoreboard in a competition the child loses. Keep it a suggestion, never a metric.

## Free first, then count, then charge

Your instinct is right. The sequence:

### Phase 1 — Free, hosted, no accounts (you are here)

Ship this build as a static site. It costs nothing to host and nothing to run. Goal is
not revenue, it is **evidence that strangers keep using it**.

Instrument from day one, privacy-first (Plausible, Umami, or self-hosted):

- Weekly active parents, and **week-4 retention** — the only number that matters early.
- Share of users who add a second child, a second month of expenses, a first photo.
- Which custody pattern people pick, and which currency. That tells you your real market.
- Where they drop off in setup.

**Bar to continue:** 30%+ of signups still active in week four. Below that, the product
is not solving it, and no amount of marketing fixes that.

### Phase 2 — Accounts and real sharing (still free)

The moment you add a backend, the metric becomes **invite acceptance rate**. If fewer
than a quarter of second parents accept, fix that before anything else.

### Phase 3 — Monetise the edges, never the core

**Keep free forever:** the calendar, the handover times, the expense ledger, and the
balance. The day a separated parent cannot see where their child is sleeping because a
payment failed is the day you deserve the review you get.

Charge for depth, storage, and third parties:

| Tier                     | Price (test this)   | What it buys                                                                                                 |
| ------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Free**                 | —                   | Two homes, one or two children, 12 months of history, calendar, expenses, bag list, limited photos.            |
| **Plus**                 | ~€4–6 / month, per household | Unlimited photo and video moments, full history, receipt attachments, PDF/CSV exports, recurring expenses, reminders, multiple children, calendar sync (Google/Apple/Outlook). |
| **Family**               | ~€8–10 / month      | Extra viewers — grandparents, a new partner, a nanny — each with their own scoped access. Handover location sharing. Multi-currency for cross-border families. |
| **Pro / Professional**   | €20+ / seat         | For mediators, family lawyers and social workers managing several families: templates, an immutable activity log, structured exports.|

Each parent pays for their own household. Never make one parent's access depend on the
other's payment — it hands one of them leverage over the other, which is exactly the
dynamic you are selling relief from.

### Monetisation ideas worth prototyping

Ranked by how well they fit the product you now have:

1. **Expense receipts and exports.** Photograph a receipt, attach it, export a clean
   PDF/CSV for the year. Directly useful for tax, benefits, and lawyers. Easy to build
   on the existing ledger. **Start here.**
2. **Calendar sync, two-way.** The single most-requested feature in every co-parenting
   app's reviews. Pure utility, high perceived value, nobody cancels over it.
3. **Grandparent / third-party view.** A read-only link to the calendar and the photo
   feed. Grandparents are an emotionally motivated, under-served, paying audience — and
   they often pay on behalf of the parent.
4. **Memory book.** Turn a year of Moments into a printed photo book or PDF for the
   child. One-off purchase, high margin, and the one thing here a child might keep.
   Sits perfectly on the feature your friend suggested as a joke.
5. **Smart handover reminders.** Push notification the evening before with the bag list
   for that specific child. Small feature, disproportionate gratitude.
6. **Shared sinking fund.** Both homes agree a monthly amount for school trips and
   shoes; the app tracks the pot and what came out of it. Pure tracking — stay out of
   payments, licensing and liability are not worth it at your stage.
7. **Pattern templates by country.** Pre-built schedules matching Danish, Polish, German
   norms and the typical court-ordered splits. Cheap to build, strong local SEO,
   genuinely useful.
8. **Professional seats.** Mediators and family lawyers already recommend tools to
   clients. One mediator can bring dozens of families. This is the highest-leverage
   channel in the whole category and the slowest to build — start the relationships now,
   build the product for it later.

**Avoid:** advertising (grotesque in this context), selling anything derived from
children's data (illegal and indefensible), and anything that gamifies one parent
against the other.

## What has to be built before anyone pays

Current build is local-only and single-device. In rough order:

1. **Accounts and a server.** Supabase or similar: auth, Postgres, row-level security,
   object storage for photos. The state tree is already one object routed through one
   file, so this is a persistence swap, not a rewrite.
2. **The invite flow.** A link that gives the other parent a working read-only calendar
   *before* they create anything. This is the growth loop; treat it as the main feature.
3. **Conflict resolution.** Two parents editing the same day needs a defined rule —
   last-write-wins is not acceptable when the subject is where a child sleeps. Days
   change only by agreement; that model is already in the swap-request flow.
4. **An audit trail.** Who changed what, when. It builds trust and it is the foundation
   of the professional tier.
5. **Notifications.** Email first, then push. The reason people open the app on a day
   nothing is wrong.
6. **PWA install + offline.** Cheaper than native, and a handover happens in a car park
   with one bar of signal.

Native apps can wait until web retention is proven.

## Going to market

- **Denmark first, deliberately.** Small, high-trust, English-comfortable, high
  smartphone penetration, and a strong cultural norm of shared custody — which is
  precisely the scenario this app is built for. Winning one country convincingly beats
  being invisible in ten. Then Poland, Sweden, Germany, the Netherlands.
- **Be where the crisis is.** People find these tools at a specific moment: the weeks
  after separation. Family lawyers, mediators, the public family-law bodies,
  municipality family services, parenting-after-separation courses, and the support
  forums and subreddits. Partnerships beat ads in every one of these channels.
- **SEO on the real queries.** "2-2-3 schedule", "how to split child expenses",
  "co-parenting calendar" — build the free calculators and schedule explainers as public
  pages. This category's search intent is unusually high-quality and the incumbents'
  content is mediocre.
- **The founder story.** It is your strongest asset and it is not reusable by a
  competitor. One condition: tell it only if it is true, and only as much as you are
  willing to have permanently public. If you were the child in this situation, that is a
  rare and credible position to speak from — and it is also the thing that will make
  strangers trust you with their children's data. Do not let a growth consultant
  dramatise it.

## The honest summary

This is a good business idea and an unusually good *first* business idea: the scope is
tractable, the first version costs nothing to host, you can get real users without
funding, and the pain is real enough that strangers will tell you the truth about it.

It will not be a fast or a huge company. It is a grind of one couple at a time, in a
category where your users are at their worst and your competitors have a decade of head
start. The two things that decide it are **whether the second parent ever joins** and
**whether you stay the cooperative tool rather than drifting into the courtroom one**.

Build it free, host it, watch week-four retention, and let that number decide whether
you keep going. Everything above is a hypothesis until it is not.
