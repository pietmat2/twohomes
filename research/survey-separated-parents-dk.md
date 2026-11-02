# Survey: separated parents in Denmark

A questionnaire for the first contact with the people Twohomes is for. Each
question exists to move a decision that is currently being guessed; a question
that changes nothing has been cut.

**Length:** 6–8 minutes, ~24 questions. Mobile first — most answers will come
from a phone in the ten minutes after bedtime.

**Language:** English here for review, Danish underneath each question in
*italics* for fielding. The Danish is mine, not a native speaker's — have it
proofread before it goes out. A clumsy Danish sentence in a survey about
divorce reads as carelessness about the subject.

**Questions this survey has to answer, in priority order**

1. Is the schedule actually the pain, or is it the arrangement around it?
   (The product is built on the schedule being the pain. That may be wrong in
   Denmark, where 7/7 is close to a default and the rhythm is rarely in doubt.)
2. Will the other household ever join? (Everything in the business case turns
   on this.)
3. Cooperative or high-conflict — which one is answering, and which one is
   willing to pay? The product serves the first and must not drift to the
   second by accident.
4. What are they using now, and what does it cost them to keep using it?
5. Is there any willingness to pay for coordination at all, in a country where
   people expect this kind of thing to be public and free?

---

## 0. Intro and consent

> This is a short set of questions from someone building a tool for separated
> parents. No company is behind it yet and nothing is being sold here. Your
> answers are used to decide what gets built, and nothing else.
>
> You can skip any question. Don't write anything that identifies your child or
> the other parent — I don't need it and I'd rather not have it. Answers are
> stored without your name unless you choose to leave an email at the end.
>
> *Et kort spørgeskema fra en, der er ved at bygge et værktøj til forældre, der
> ikke bor sammen. Der står ingen virksomhed bag endnu, og der bliver ikke solgt
> noget her. Dine svar bruges udelukkende til at beslutte, hvad der skal bygges.*
>
> *Du må springe ethvert spørgsmål over. Skriv ikke noget, der kan identificere
> dit barn eller den anden forælder — jeg har ikke brug for det. Svarene gemmes
> uden dit navn, medmindre du selv skriver en mail til sidst.*

☐ I've read this and want to take part.
*☐ Jeg har læst det og vil gerne deltage.*

---

## 1. Screener

**S1. Do you share the care of one or more children with someone you no longer
live with?**
*Deler du omsorgen for et eller flere børn med en, du ikke længere bor sammen med?*
- Yes → continue
- No → close politely
- It's being decided right now → continue, **flag as "in transition"**

> In transition is the most valuable segment and the easiest to miss: it is the
> only moment when a family actively goes looking for a tool. Tag it and
> oversample it in the interviews.

**S2. How old are the children you share? (tick all)**
*Hvor gamle er de børn, I deles om?*
0–2 · 3–5 · 6–9 · 10–12 · 13–15 · 16–17

**S3. How long has the current arrangement been running?**
*Hvor længe har den nuværende ordning kørt?*
Under 6 months · 6–12 months · 1–3 years · 3–5 years · More than 5 years

> Cross this with everything. A family six months in and a family five years in
> are different products.

---

## 2. The arrangement

**A1. Which pattern is closest to yours?**
*Hvilken ordning ligner jeres mest?*
7/7 (week on, week off) · 9/5 · 10/4 · 12/2 · 2-2-3 · Every other weekend ·
Mostly with me, visits with the other parent · It changes constantly · Other: ___

**A2. Is the arrangement written down anywhere?**
*Er ordningen skrevet ned nogen steder?*
- An agreement through Familieretshuset / a court decision
- A written agreement between us, no authority involved
- Nothing written — we just know
- *Andet:* ___

**A3. In a normal month, how many days differ from the plan?**
*Hvor mange dage i en normal måned afviger fra planen?*
None · 1–2 · 3–5 · More than 5 · There isn't really a plan to differ from

> **This is the question the product rests on.** If most answers are "none",
> then the schedule is solved in Denmark and the swap mechanic is a solution
> looking for a problem. Build the comparison page around whatever this says.

**A4. Who usually raises a change?**
*Hvem foreslår typisk en ændring?*
Mostly me · Mostly the other parent · Both about equally · Changes come from
outside (work, school, illness)

---

## 3. What actually happens now

**B1. Where does the schedule live?** (tick all)
*Hvor står planen?*
In my head · Paper or a wall calendar · My own phone calendar · A calendar
shared with the other parent · A co-parenting app · Text messages · Aula ·
*Andet:* ___

**B2. How do you and the other parent arrange a change?** (tick all)
*Hvordan aftaler I en ændring?*
SMS · WhatsApp/Messenger/Signal · A call · In person at handover · Through the
children · Through a lawyer or Familieretshuset · *Andet:* ___

> "Through the children" is the answer that matters most and the one people are
> least likely to tick. Put it mid-list, never last.

**B3. Think about the last change that was agreed. How long did it take from
first message to settled?**
*Tænk på den seneste ændring, I aftalte. Hvor lang tid gik der?*
Minutes · A few hours · A day or two · Longer · It was never really settled

**B4. In the last month, how often have you had to look something up or ask to
be sure who had the children on a given day?**
*Hvor ofte har du den seneste måned skullet slå op eller spørge for at være
sikker på, hvem der havde børnene?*
Never · Once · 2–3 times · Weekly · Several times a week

> If "never" dominates, the hero promise on the website ("who has them
> tonight") is worthless and has to be replaced. Treat that as a finding about
> the marketing, not about the product.

**B5. Which of these has gone wrong in the last six months?** (tick all)
*Hvad er gået galt det seneste halve år?*
- Both of us turned up · Neither of us turned up
- Something was forgotten at the other home (clothes, medicine, homework, gear)
- A school or activity message only reached one of us
- A holiday week wasn't agreed in time (uge 7, uge 42, summer)
- A disagreement about who pays for something
- An argument in front of the children
- A child was asked to carry a message between us
- Nothing has gone wrong

---

## 4. The last time it broke

**C1. Describe the last time coordinating with the other household actually
cost you something — time, money, sleep, or a row. What happened?** (open text)
*Beskriv sidste gang koordineringen med det andet hjem reelt kostede dig noget —
tid, penge, søvn eller et skænderi. Hvad skete der?*

> The single most valuable question in the survey. Read these before any chart.
> Three or four recurring stories here should decide the next three months of
> the roadmap.

**C2. What did you do about it?** (open text)
*Hvad gjorde du ved det?*

> Behaviour, not wishes. Someone who already built a spreadsheet is a customer;
> someone who shrugged is not.

---

## 5. The other household

**D1. If a tool like this would help you, how likely is the other parent to use
it too?**
*Hvor sandsynligt er det, at den anden forælder også ville bruge sådan et værktøj?*
Certain · Likely · Unlikely · Never · I wouldn't want them to have access

> "I wouldn't want them to have access" is not a failure answer — it is a
> product requirement, and the read-only share link is the feature that serves
> it. Count it separately, never fold it into "Never".

**D2. Would a tool you used alone — with no account for the other parent — be
worth anything to you?**
*Ville et værktøj, du brugte alene, uden konto til den anden forælder, være
noget værd for dig?*
Yes, most of the value · Yes, some · Not really · No

**D3. Has anything stopped you trying a shared tool before?** (open text)
*Har noget afholdt dig fra at prøve et fælles værktøj før?*

---

## 6. Money between the households

**E1. Apart from børnebidrag, how do you settle shared costs?**
*Ud over børnebidrag, hvordan gør I op med fælles udgifter?*
MobilePay as we go · We each pay our own and don't settle · A spreadsheet or
notes · One of us pays most of it · We argue about it · *Andet:* ___

**E2. Roughly how much went between the two households last month, outside
børnebidrag?**
*Cirka hvor meget gik der mellem de to hjem sidste måned, ud over børnebidrag?*
0 kr · Under 500 · 500–1500 · 1500–3000 · Over 3000 · No idea

**E3. Is the money a source of friction?**
*Er pengene en kilde til gnidninger?*
Not at all · A bit · Often · It's the main thing we disagree about

---

## 7. How the relationship works

**F1. Which comes closest?**
*Hvad passer bedst?*
- We cooperate well and sort things out directly
- It works, but it takes care and effort
- It's tense; we keep contact to a minimum
- There's open conflict
- There's no contact at all

> **The strategic fork.** Cooperative co-parents want speed and warmth;
> high-conflict parents want documentation and court exports. The two want
> opposite products. If this survey comes back majority "tense" or worse, the
> cooperative-first bet needs re-examining — or the recruitment channel is
> skewing it (see below).

**F2. Would you want a record of changes that could be shown to a third party?**
*Vil du have en historik over ændringer, der kan vises til en tredjepart?*
No, that would make things worse · Doesn't matter to me · Yes, that would be
reassuring · Yes, I need it

---

## 8. The children's data

**G1. How much does it matter to you where your children's information is
stored?**
*Hvor meget betyder det for dig, hvor dine børns oplysninger gemmes?*
Not much · Somewhat · A lot · It would decide whether I used it

**G2. Which of these would stop you using a tool like this?** (tick all)
*Hvad ville afholde dig fra at bruge sådan et værktøj?*
Photos of my children on a company's servers · The other parent seeing my
location · Not knowing who owns the company · Advertising · A subscription ·
That it could be used against me later · None of these

---

## 9. Paying for it

**H1. Have you ever paid for anything to help with this?**
*Har du nogensinde betalt for noget, der skulle hjælpe med det her?*
No · A lawyer or mediator · An app or service · Something else: ___

> Past spend predicts future spend. Stated intent does not.

**H2–H4. Price sensitivity** — four-question van Westendorp, for a tool used by
both households:
*Til hvilken månedlig pris ville det være…*
- so cheap you'd doubt it was any good? *for billigt til at være godt?*
- a bargain? *et godt køb?*
- expensive but still worth considering? *dyrt, men stadig værd at overveje?*
- so expensive you'd never consider it? *så dyrt, at du aldrig ville overveje det?*

> Do **not** ask "would you pay X?". It over-reports by a wide margin. Even van
> Westendorp only brackets a range — treat it as a sanity check, not a price.

---

## 10. Close

**Z1. If I'm building this, may I ask you a few things later?**
*Må jeg stille dig et par spørgsmål senere?*
☐ Yes — email: ___

**Z2. Anything you'd want whoever builds this to understand?** (open text)
*Er der noget, du gerne vil have, at den, der bygger det her, forstår?*

---

## Fielding notes

**Sample.** 120 completed responses gives roughly ±9 percentage points — enough
to kill or confirm a direction, not enough to split by pattern and age at once.
Do not report percentages on a base under 30.

**Where to recruit, and how each channel lies to you**
- Facebook groups for separated parents — fastest, and **skews heavily to
  high-conflict**: people in a calm arrangement don't join support groups.
  Expect F1 to look worse than reality.
- Parent groups at schools and clubs, via friends — slower, far closer to the
  cooperative majority.
- Mødrehjælpen, Foreningen Far — reach, but each carries its own selection.
- Recruit *both* mothers and fathers deliberately. A survey answered by 90%
  mothers will design a product only mothers recognise.

**Decision rules, agreed before the data arrives** (so the numbers aren't read
to suit the plan)
- A3 "none" over ~50% → the swap mechanic is not the wedge in Denmark. Lead on
  whatever B5 says instead.
- B4 "never" over ~50% → rewrite the website hero; it currently promises an
  answer nobody is looking for.
- D1 "unlikely"/"never" over ~40% → solo-first is confirmed as the whole
  strategy, not a fallback, and the read-only link becomes the main feature.
- F1 "tense" or worse over ~50% → either the channel is skewed, or the
  cooperative-first bet is wrong. Check the channel before changing the bet.
- E3 "main thing we disagree about" over ~30% → money, not the calendar, is the
  front door.

**Ethics.** A survey about separation reaches people on a bad day. Keep every
question skippable, don't ask anything about the other parent that could be
used in a dispute, state plainly that no company is behind it yet, and delete
the email addresses once the interviews are done.
