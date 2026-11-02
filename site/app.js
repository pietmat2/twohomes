/*
 * Twohomes — marketing site behaviour.
 *
 * Six small things, in order: language, header, reveals, quotes, the live
 * counters, and the contact form. No dependencies.
 */

/* ───────────────────────────── configuration ───────────────────────────── */

/* Where the live numbers come from. A local JSON file by default, so the
   figures can be changed without touching this page; point it at a real
   endpoint (any URL returning the same shape) when there is one. */
const LIVE_ENDPOINT = 'stats.json';

/* How often to re-read it, in seconds. */
const LIVE_REFRESH = 60;

/* Used when the endpoint cannot be reached — for instance when this file is
   opened straight off the disk, where fetch() is blocked.
   PLACEHOLDERS: set these, and stats.json, to the real figures before launch. */
const LIVE_FALLBACK = { familiesHelped: 0, activeUsers: 0, updated: null };

/* The address the contact form hands the message to. */
const CONTACT_EMAIL = 'hello@twohomes.app';

/* ───────────────────────────── copy ───────────────────────────── */

const COPY = {
  en: {
    'doc.title': 'Twohomes — one child, two homes, one plan',
    'a11y.skip': 'Skip to content',
    'a11y.language': 'Language',
    'a11y.menu': 'Menu',
    'a11y.prev': 'Previous quote',
    'a11y.next': 'Next quote',
    'a11y.footnav': 'Footer',

    'nav.service': 'The service',
    'nav.how': 'How it works',
    'nav.voices': 'Voices',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.cta': 'Request early access',

    'hero.kicker': 'Co-parenting, calmly',
    'hero.t1': 'One child.',
    'hero.t2': 'Two homes.',
    'hero.t3': 'One plan.',
    'hero.lead':
      'Twohomes answers the questions that cause most of the friction between separated parents — who has them tonight, who is paying for the boots, who is taking them to the dentist — without either parent having to ask the other.',
    'hero.cta1': 'Request early access',
    'hero.cta2': 'See what it does',
    'hero.fine': 'Useful for one parent on day one. The second home is an upgrade, never a requirement.',

    'mock.date': 'Monday 2 November',
    'mock.answer1': 'Emma is with',
    'mock.answer2': 'you',
    'mock.answer3': 'tonight.',
    'mock.change': 'Changeover Wednesday, 08:00 at school',
    'mock.waiting': 'Waiting on you',
    'mock.request': 'John asks to swap Friday the 13th',
    'mock.accept': 'Accept',
    'mock.decline': "Can't",
    'mock.balance': 'John owes you',

    'live.title': 'Live from the beta',
    'live.families': 'families helped',
    'live.familiesSub': 'households that have set up a rotation and kept it running',
    'live.active': 'active parents',
    'live.activeSub': 'opened Twohomes at least once in the last 30 days',
    'live.updated': 'Updated',
    'live.note': '· figures are placeholders until launch',
    'live.never': 'not yet',
    'live.now': 'just now',

    'fact.patterns': 'custody rotations built in, plus your own',
    'fact.data': 'readable data on our servers, by design',
    'fact.loop': 'to open the app and know where everyone is',
    'fact.lang': "countries' school holidays, built in",

    'service.kicker': 'The service',
    'service.title': 'A shared answer, instead of a conversation nobody wants to have.',
    'service.lead':
      'Twohomes is a calm shared calendar and expense ledger for separated parents. Five screens, nothing more: the schedule both homes agree on, the money that moves between them, and the handful of facts about a child that always travel with them.',

    's1.title': 'Today',
    's1.body':
      'Who has the children right now, when the next changeover is, and anything waiting on you. One sentence, above everything else.',
    's2.title': 'Calendar',
    's2.body':
      'A month of custody days in two colours. Tap any day to reassign it or to ask the other home for a swap. School breaks and public holidays are already on it.',
    's3.title': 'Money',
    's3.body':
      'Shared costs, who owes whom, and a ledger both sides can audit. Twohomes records money that moved; it never moves money.',
    's4.title': 'Moments',
    's4.body':
      'A photo and a line from whichever home they are in, so the week away is not a blank. Plus one activity idea, every week.',
    's5.title': 'Kids',
    's5.body':
      'Allergies, school, doctor, and the list of things that have to travel between homes. Written once, visible to both.',
    's6.title': 'Swap requests that cannot start a fight',
    's6.body':
      'Asking for a day does not take it. A request sits as pending until the other home accepts, and only then does the calendar move. Declining leaves everything exactly as it was.',

    'patterns.label': 'Set the rotation once',
    'patterns.custom': 'your own',
    'patterns.note':
      'The pattern describes the agreement. Any single day can still be changed by hand — real life always wins.',

    'how.kicker': 'How it works',
    'how.title': 'Three steps, and then you mostly forget about us.',
    'how1.title': 'Set the pattern',
    'how1.body':
      'Pick the rotation you already live by and the date it starts. The calendar fills itself in for every month ahead, holidays included.',
    'how2.title': "Invite the other home — or don't",
    'how2.body':
      'Both homes can sync, end-to-end encrypted, so a request lands on the other phone. Not ready for that? Send a read-only link to next month instead. No account, no argument.',
    'how3.title': 'Live in it',
    'how3.body':
      "A reminder the evening before every changeover, with that child's bag list. Costs added as they happen. A history neither of you has to defend.",
    'assure.title': 'Private by construction',
    'assure.body':
      "Your children's photos, health notes and school details stay on your devices. What passes between two homes is encrypted end-to-end and travels through a relay that cannot read it. We built it that way because children's data is regulated data — and because trust is the only moat worth having.",

    'voices.kicker': 'Voices',
    'voices.title': 'What we hope to hear.',
    'voices.disclaimer':
      'Sample quotes. Twohomes has not launched yet — these are written to show the shape of the page, not real endorsements.',
    'q1.text':
      '"We stopped negotiating by text message. The calendar says whose Tuesday it is, and that is the end of it. I had not realised how much of the week went on that."',
    'q1.name': 'Mette',
    'q1.meta': 'Sample quote · two children, week on / week off',
    'q2.text':
      '"The ledger ended an argument we had been having for two years. Not because it took a side — because there was finally nothing to remember wrong."',
    'q2.name': 'Anders',
    'q2.meta': 'Sample quote · one child, 2-2-3',
    'q3.text':
      '"I used it alone for four months before their father joined. That mattered. Nothing about it demanded that he take part before he was ready."',
    'q3.name': 'Katarzyna',
    'q3.meta': 'Sample quote · two children, every other weekend',
    'q4.text':
      '"My daughter stopped being the one carrying messages between us. That is the whole thing, really. She gets to just be eight."',
    'q4.name': 'Sofie',
    'q4.meta': 'Sample quote · one child, 3-4-4-3',

    'about.kicker': 'About',
    'about.title': 'Built for the child in the middle.',
    'about.lead':
      'Twohomes started as a tool for one family, not a business plan. Two households, a calendar on each fridge, and a child who kept being asked to carry the message between them. Every feature since has had the same tiebreaker: does this make the week quieter for the child?',
    'about.body':
      'We are deliberately not building a courtroom. There are good apps for high-conflict separations, full of tamper-proof logs and exports for lawyers. This is the other thing: a product for two parents who mostly manage, who are tired, and who would like the admin of it to take thirty seconds instead of an evening.',
    'p1.title': 'The child is the user.',
    'p1.body': 'Every decision is settled by what makes their week calmer, not by what we could charge for.',
    'p2.title': 'Local-first.',
    'p2.body': 'Your data lives on your device. Sharing is a choice you make, screen by screen.',
    'p3.title': 'Never the thing that starts a fight.',
    'p3.body': 'No read receipts, no scoreboard, no nudges designed to make someone look bad.',
    'p4.title': 'Boring on purpose.',
    'p4.body': 'Calendars and ledgers should be unglamorous, fast and quiet. We will not gamify your family.',
    'about.pullquote': '"One child, two homes, one plan."',
    'about.pullmeta': 'The sentence the whole product has to keep answering.',
    'meta.k1': 'Designed in',
    'meta.v1': 'Denmark',
    'meta.k2': 'Available in',
    'meta.v2': 'English, Danish and Polish',
    'meta.k3': 'Status',
    'meta.v3': 'Private beta, 2026',
    'meta.k4': 'Platforms',
    'meta.v4': 'iOS, Android and the web',

    'contact.kicker': 'Contact',
    'contact.title': 'Tell us about your week.',
    'contact.lead':
      'The private beta takes a small number of families at a time, so that every one of them gets answered properly. Write what your rotation looks like and what currently goes wrong, and we will tell you honestly whether Twohomes helps yet.',
    'contact.k1': 'Email',
    'contact.k2': 'Reply time',
    'contact.v2': 'Within two working days',
    'contact.k3': 'Press & partners',

    'form.name': 'Your name',
    'form.namePh': 'Mette Jensen',
    'form.email': 'Email',
    'form.emailPh': 'you@example.com',
    'form.country': 'Where do you co-parent?',
    'form.other': 'Somewhere else',
    'form.message': 'What does your week look like?',
    'form.messagePh': 'Two children, 2-2-3, and we lose every Sunday evening to the same conversation…',
    'form.submit': 'Request early access',
    'form.fine':
      'This opens your own mail app with the message ready to send — nothing is submitted to a server from this page.',
    'form.ok': 'Your mail app should be opening. If it did not, write to ' + CONTACT_EMAIL + '.',
    'err.name': 'Please tell us what to call you.',
    'err.email': 'That email address does not look right.',
    'err.message': 'A sentence or two is plenty.',
    'mail.subject': 'Early access — Twohomes',
    'mail.country': 'Co-parenting in',

    'foot.line': 'A calm shared calendar and expense ledger for separated parents.',
    'foot.legal': 'Designed in Denmark. Built to be deleted the day you no longer need it.',
  },

  da: {
    'doc.title': 'Twohomes — ét barn, to hjem, én plan',
    'a11y.skip': 'Gå til indhold',
    'a11y.language': 'Sprog',
    'a11y.menu': 'Menu',
    'a11y.prev': 'Forrige citat',
    'a11y.next': 'Næste citat',
    'a11y.footnav': 'Sidefod',

    'nav.service': 'Tjenesten',
    'nav.how': 'Sådan virker det',
    'nav.voices': 'Stemmer',
    'nav.about': 'Om os',
    'nav.contact': 'Kontakt',
    'nav.cta': 'Få tidlig adgang',

    'hero.kicker': 'Delt forældreskab, i ro',
    'hero.t1': 'Ét barn.',
    'hero.t2': 'To hjem.',
    'hero.t3': 'Én plan.',
    'hero.lead':
      'Twohomes svarer på de spørgsmål, der skaber mest gnidning mellem separerede forældre — hvem har dem i aften, hvem betaler for støvlerne, hvem tager dem til tandlægen — uden at nogen af jer skal spørge den anden.',
    'hero.cta1': 'Få tidlig adgang',
    'hero.cta2': 'Se hvad den kan',
    'hero.fine': 'Brugbar for én forælder fra dag ét. Det andet hjem er en forbedring, aldrig et krav.',

    'mock.date': 'Mandag 2. november',
    'mock.answer1': 'Emma er hos',
    'mock.answer2': 'dig',
    'mock.answer3': 'i aften.',
    'mock.change': 'Skift onsdag kl. 08.00 på skolen',
    'mock.waiting': 'Venter på dig',
    'mock.request': 'John spørger om at bytte fredag den 13.',
    'mock.accept': 'Accepter',
    'mock.decline': 'Kan ikke',
    'mock.balance': 'John skylder dig',

    'live.title': 'Live fra betaen',
    'live.families': 'familier hjulpet',
    'live.familiesSub': 'husstande, der har sat en turnus op og holder den kørende',
    'live.active': 'aktive forældre',
    'live.activeSub': 'har åbnet Twohomes mindst én gang i de seneste 30 dage',
    'live.updated': 'Opdateret',
    'live.note': '· tallene er pladsholdere indtil lanceringen',
    'live.never': 'endnu ikke',
    'live.now': 'lige nu',

    'fact.patterns': 'indbyggede turnusmønstre, plus dit eget',
    'fact.data': 'læsbare data på vores servere — med vilje',
    'fact.loop': 'tager det at åbne appen og vide, hvor alle er',
    'fact.lang': 'landes skoleferier, indbygget',

    'service.kicker': 'Tjenesten',
    'service.title': 'Et fælles svar i stedet for en samtale, ingen har lyst til.',
    'service.lead':
      'Twohomes er en rolig fælles kalender og et fælles udgiftsregnskab for separerede forældre. Fem skærme, ikke mere: den plan begge hjem er enige om, pengene der bevæger sig mellem dem, og de få oplysninger om et barn, der altid skal med.',

    's1.title': 'I dag',
    's1.body':
      'Hvem har børnene lige nu, hvornår næste skift er, og hvad der venter på dig. Én sætning, øverst af alt.',
    's2.title': 'Kalender',
    's2.body':
      'En måned med samværsdage i to farver. Tryk på en dag for at flytte den eller bede det andet hjem om at bytte. Skoleferier og helligdage er allerede sat ind.',
    's3.title': 'Penge',
    's3.body':
      'Fælles udgifter, hvem der skylder hvem, og et regnskab begge sider kan efterprøve. Twohomes registrerer penge, der er flyttet — den flytter aldrig penge selv.',
    's4.title': 'Øjeblikke',
    's4.body':
      'Et billede og en linje fra det hjem, de er i, så ugen væk ikke bliver et tomrum. Og én idé til noget at lave, hver uge.',
    's5.title': 'Børn',
    's5.body':
      'Allergier, skole, læge og listen over ting, der skal med mellem hjemmene. Skrevet én gang, synligt for begge.',
    's6.title': 'Byttebeder, der ikke kan starte et skænderi',
    's6.body':
      'At spørge om en dag er ikke at tage den. En anmodning står som afventende, indtil det andet hjem accepterer — først dér flytter kalenderen sig. Siger man nej, står alt præcis som før.',

    'patterns.label': 'Sæt turnussen op én gang',
    'patterns.custom': 'dit eget',
    'patterns.note':
      'Mønstret beskriver aftalen. Enkelte dage kan altid rettes i hånden — virkeligheden vinder altid.',

    'how.kicker': 'Sådan virker det',
    'how.title': 'Tre trin, og så glemmer I os stort set.',
    'how1.title': 'Sæt mønstret',
    'how1.body':
      'Vælg den turnus, I allerede lever efter, og datoen den starter. Kalenderen udfylder sig selv for hver måned frem, helligdage med.',
    'how2.title': 'Inviter det andet hjem — eller lad være',
    'how2.body':
      'Begge hjem kan synkronisere, end-to-end-krypteret, så en anmodning lander på den anden telefon. Ikke klar til det? Send et link til næste måned, kun til at læse. Ingen konto, ingen diskussion.',
    'how3.title': 'Lev i den',
    'how3.body':
      'En påmindelse aftenen før hvert skift, med barnets pakkeliste. Udgifter tilføjet, når de opstår. En historik ingen af jer skal forsvare.',
    'assure.title': 'Privat af konstruktion',
    'assure.body':
      'Billederne af jeres børn, helbredsnoterne og skoleoplysningerne bliver på jeres egne enheder. Det, der går mellem to hjem, er end-to-end-krypteret og sendes gennem et relæ, der ikke kan læse det. Vi byggede det sådan, fordi børns data er regulerede data — og fordi tillid er den eneste beskyttelse, der er værd at have.',

    'voices.kicker': 'Stemmer',
    'voices.title': 'Det, vi håber at høre.',
    'voices.disclaimer':
      'Eksempelcitater. Twohomes er ikke lanceret endnu — de er skrevet for at vise sidens form, ikke rigtige anbefalinger.',
    'q1.text':
      '»Vi holdt op med at forhandle over sms. Kalenderen siger, hvis tirsdag det er, og så er den ikke længere. Jeg havde ikke set, hvor meget af ugen der gik med det.«',
    'q1.name': 'Mette',
    'q1.meta': 'Eksempelcitat · to børn, uge/uge',
    'q2.text':
      '»Regnskabet afsluttede et skænderi, vi havde haft i to år. Ikke fordi det tog parti — men fordi der endelig ikke var noget at huske forkert.«',
    'q2.name': 'Anders',
    'q2.meta': 'Eksempelcitat · ét barn, 2-2-3',
    'q3.text':
      '»Jeg brugte den alene i fire måneder, før deres far kom med. Det betød noget. Intet i den krævede, at han deltog, før han var klar.«',
    'q3.name': 'Katarzyna',
    'q3.meta': 'Eksempelcitat · to børn, hver anden weekend',
    'q4.text':
      '»Min datter holdt op med at være den, der bar beskeder mellem os. Det er egentlig hele sagen. Hun får lov at være otte år.«',
    'q4.name': 'Sofie',
    'q4.meta': 'Eksempelcitat · ét barn, 3-4-4-3',

    'about.kicker': 'Om os',
    'about.title': 'Bygget til barnet i midten.',
    'about.lead':
      'Twohomes begyndte som et redskab til én familie, ikke som en forretningsplan. To husstande, en kalender på hver køleskabsdør, og et barn, der blev bedt om at bære beskeden mellem dem. Hver funktion siden er afgjort på det samme: bliver barnets uge roligere af det her?',
    'about.body':
      'Vi bygger med vilje ikke en retssal. Der findes gode apps til separationer med høj konflikt, fulde af sikrede logfiler og udtræk til advokater. Det her er det andet: et produkt til to forældre, der stort set klarer det, som er trætte, og som gerne vil have, at det administrative tager tredive sekunder i stedet for en aften.',
    'p1.title': 'Barnet er brugeren.',
    'p1.body': 'Hver beslutning afgøres af, hvad der gør barnets uge roligere — ikke af, hvad vi kunne tage penge for.',
    'p2.title': 'Lokalt først.',
    'p2.body': 'Dine data bor på din egen enhed. Deling er et valg, du tager, skærm for skærm.',
    'p3.title': 'Aldrig det, der starter et skænderi.',
    'p3.body': 'Ingen læsekvitteringer, ingen pointtavle, ingen påmindelser bygget til at få nogen til at se dårlig ud.',
    'p4.title': 'Kedelig med vilje.',
    'p4.body': 'Kalendere og regnskaber skal være uglamourøse, hurtige og stille. Vi laver ikke jeres familie til et spil.',
    'about.pullquote': '»Ét barn, to hjem, én plan.«',
    'about.pullmeta': 'Den sætning hele produktet bliver ved med at skulle svare på.',
    'meta.k1': 'Designet i',
    'meta.v1': 'Danmark',
    'meta.k2': 'Fås på',
    'meta.v2': 'engelsk, dansk og polsk',
    'meta.k3': 'Status',
    'meta.v3': 'Privat beta, 2026',
    'meta.k4': 'Platforme',
    'meta.v4': 'iOS, Android og web',

    'contact.kicker': 'Kontakt',
    'contact.title': 'Fortæl os om jeres uge.',
    'contact.lead':
      'Den private beta tager et lille antal familier ad gangen, så alle får et ordentligt svar. Skriv, hvordan jeres turnus ser ud, og hvad der går skævt i dag — så siger vi ærligt, om Twohomes hjælper endnu.',
    'contact.k1': 'E-mail',
    'contact.k2': 'Svartid',
    'contact.v2': 'Inden for to hverdage',
    'contact.k3': 'Presse & partnere',

    'form.name': 'Dit navn',
    'form.namePh': 'Mette Jensen',
    'form.email': 'E-mail',
    'form.emailPh': 'dig@eksempel.dk',
    'form.country': 'Hvor deler I forældreskabet?',
    'form.other': 'Et andet sted',
    'form.message': 'Hvordan ser jeres uge ud?',
    'form.messagePh': 'To børn, 2-2-3, og vi mister hver søndag aften på den samme samtale…',
    'form.submit': 'Få tidlig adgang',
    'form.fine':
      'Dette åbner dit eget mailprogram med beskeden klar til at sende — intet bliver sendt til en server fra denne side.',
    'form.ok': 'Dit mailprogram skulle åbne nu. Hvis ikke, så skriv til ' + CONTACT_EMAIL + '.',
    'err.name': 'Skriv, hvad vi skal kalde dig.',
    'err.email': 'Den e-mailadresse ser ikke rigtig ud.',
    'err.message': 'En sætning eller to er rigeligt.',
    'mail.subject': 'Tidlig adgang — Twohomes',
    'mail.country': 'Deler forældreskab i',

    'foot.line': 'En rolig fælles kalender og et fælles udgiftsregnskab for separerede forældre.',
    'foot.legal': 'Designet i Danmark. Bygget til at kunne slettes den dag, du ikke behøver den længere.',
  },
};

const LOCALES = { en: 'en-GB', da: 'da-DK' };

/* ───────────────────────────── language ───────────────────────────── */

let lang = 'en';

function t(key) {
  return (COPY[lang] && COPY[lang][key]) || COPY.en[key] || '';
}

function setLang(next, { remember = true } = {}) {
  if (!COPY[next]) return;
  lang = next;
  document.documentElement.lang = next;
  document.documentElement.dataset.lang = next;
  document.title = t('doc.title');

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const value = t(el.dataset.i18n);
    if (value) el.textContent = value;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const value = t(el.dataset.i18nPlaceholder);
    if (value) el.placeholder = value;
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    const value = t(el.dataset.i18nAriaLabel);
    if (value) el.setAttribute('aria-label', value);
  });

  document.querySelectorAll('[data-set-lang]').forEach((btn) => {
    const on = btn.dataset.setLang === next;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', String(on));
  });

  if (remember) {
    try {
      localStorage.setItem('twohomes.lang', next);
    } catch {
      /* private mode: the choice simply does not persist */
    }
  }

  renderStats();
}

document.querySelectorAll('[data-set-lang]').forEach((btn) => {
  btn.addEventListener('click', () => setLang(btn.dataset.setLang));
});

/* The language is chosen at the bottom of this file, once the counters and the
   rest of the state it refreshes exist. */

/* ───────────────────────────── header ───────────────────────────── */

const head = document.getElementById('head');
const nav = document.getElementById('nav');
const burger = document.getElementById('burger');

const onScroll = () => head.classList.toggle('is-stuck', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') === 'true';
  burger.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('is-open', !open);
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    burger.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('is-open')) {
    burger.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    burger.focus();
  }
});

/* which section am I in */
const navLinks = [...nav.querySelectorAll('a')];
const sections = navLinks
  .map((a) => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window && sections.length) {
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) =>
          a.classList.toggle('is-current', a.getAttribute('href') === '#' + entry.target.id)
        );
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  sections.forEach((section) => spy.observe(section));
}

/* ───────────────────────────── reveals ───────────────────────────── */

const reveals = [...document.querySelectorAll('.reveal')];

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-in'));
}

/* ───────────────────────────── testimonials ───────────────────────────── */

const quotes = [...document.querySelectorAll('[data-quote]')];
const dots = document.getElementById('dots');
let current = 0;
let rotation;

const show = (index) => {
  current = (index + quotes.length) % quotes.length;
  quotes.forEach((q, i) => q.classList.toggle('is-on', i === current));
  [...dots.children].forEach((d, i) => d.classList.toggle('is-on', i === current));
};

const hold = () => {
  clearInterval(rotation);
  rotation = setInterval(() => show(current + 1), 9000);
};

if (quotes.length) {
  quotes.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = index === 0 ? 'is-on' : '';
    dot.setAttribute('aria-label', `${index + 1}`);
    dot.addEventListener('click', () => {
      show(index);
      hold();
    });
    dots.append(dot);
  });

  document.querySelector('[data-quote-prev]').addEventListener('click', () => {
    show(current - 1);
    hold();
  });
  document.querySelector('[data-quote-next]').addEventListener('click', () => {
    show(current + 1);
    hold();
  });

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) hold();
}

/* ───────────────────────── live counters ─────────────────────────
 * Two numbers, read from LIVE_ENDPOINT and counted up when they first come
 * into view. A value of 0 is rendered as "not yet" rather than a hollow zero.
 */

const counterEls = [...document.querySelectorAll('[data-counter]')];
const updatedEl = document.getElementById('liveUpdated');
let stats = { ...LIVE_FALLBACK };
let shown = {};
let countersVisible = false;

function formatNumber(value) {
  return new Intl.NumberFormat(LOCALES[lang]).format(value);
}

function animateTo(el, from, to) {
  const key = el.dataset.counter;
  if (to <= 0) {
    el.textContent = t('live.never');
    shown[key] = 0;
    return;
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || from === to) {
    el.textContent = formatNumber(to);
    shown[key] = to;
    return;
  }

  const duration = 1400;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const value = Math.round(from + (to - from) * eased);
    el.textContent = formatNumber(value);
    shown[key] = value;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function renderUpdated() {
  if (!updatedEl) return;
  if (!stats.updated) {
    updatedEl.textContent = '—';
    updatedEl.removeAttribute('datetime');
    return;
  }
  const when = new Date(stats.updated);
  if (Number.isNaN(when.getTime())) return;
  updatedEl.dateTime = when.toISOString();

  const minutes = Math.round((Date.now() - when.getTime()) / 60000);
  if (minutes < 1) {
    updatedEl.textContent = t('live.now');
    return;
  }
  const rtf = new Intl.RelativeTimeFormat(LOCALES[lang], { numeric: 'auto' });
  if (minutes < 60) updatedEl.textContent = rtf.format(-minutes, 'minute');
  else if (minutes < 60 * 24) updatedEl.textContent = rtf.format(-Math.round(minutes / 60), 'hour');
  else updatedEl.textContent = when.toLocaleDateString(LOCALES[lang], { day: 'numeric', month: 'long' });
}

/* True once the counters have reached the viewport — including the case where
   a jump down the page carried them past it before the observer reported in. */
const countersReached = () =>
  counterEls.some((el) => el.getBoundingClientRect().top < window.innerHeight * 0.85);

function renderStats() {
  renderUpdated();
  if (!countersVisible) {
    if (!countersReached()) return;
    countersVisible = true;
  }
  counterEls.forEach((el) => {
    const key = el.dataset.counter;
    const to = Number(stats[key]) || 0;
    animateTo(el, shown[key] ?? 0, to);
  });
}

async function fetchStats() {
  try {
    const res = await fetch(LIVE_ENDPOINT, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    stats = {
      familiesHelped: Number(data.familiesHelped) || 0,
      activeUsers: Number(data.activeUsers) || 0,
      updated: data.updated || new Date().toISOString(),
    };
  } catch {
    /* No endpoint reachable (offline, or opened as a file): keep the fallback. */
    stats = { ...LIVE_FALLBACK };
  }
  renderStats();
}

if (counterEls.length) {
  if ('IntersectionObserver' in window) {
    const once = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) && !countersReached()) return;
        countersVisible = true;
        renderStats();
        once.disconnect();
      },
      { threshold: 0.35 }
    );
    counterEls.forEach((el) => once.observe(el));
    /* Belt and braces: a jump straight down the page can skip the observer's
       one intersecting notification, and a stuck zero is worse than an
       un-animated number. */
    window.addEventListener(
      'scroll',
      () => {
        if (!countersVisible && countersReached()) {
          countersVisible = true;
          renderStats();
          once.disconnect();
        }
      },
      { passive: true }
    );
  } else {
    countersVisible = true;
  }

  fetchStats();
  setInterval(fetchStats, LIVE_REFRESH * 1000);
  setInterval(renderUpdated, 60000);
}

/* ───────────────────────────── contact form ───────────────────────────── */

const form = document.getElementById('form');
const formOk = document.getElementById('formOk');

function fail(input, messageKey) {
  input.closest('.field').classList.add('has-err');
  const err = form.querySelector(`[data-err-for="${input.id}"]`);
  if (err) err.textContent = t(messageKey);
  input.setAttribute('aria-invalid', 'true');
}

function clearErrors() {
  form.querySelectorAll('.has-err').forEach((f) => f.classList.remove('has-err'));
  form.querySelectorAll('.err').forEach((e) => (e.textContent = ''));
  form.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearErrors();
  formOk.hidden = true;

  const name = form.elements.name;
  const email = form.elements.email;
  const message = form.elements.message;
  const country = form.elements.country;

  let firstBad = null;
  if (!name.value.trim()) {
    fail(name, 'err.name');
    firstBad = firstBad || name;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
    fail(email, 'err.email');
    firstBad = firstBad || email;
  }
  if (message.value.trim().length < 10) {
    fail(message, 'err.message');
    firstBad = firstBad || message;
  }
  if (firstBad) {
    firstBad.focus();
    return;
  }

  const body = [
    message.value.trim(),
    '',
    `${t('mail.country')}: ${country.value}`,
    `${t('form.name')}: ${name.value.trim()}`,
    `${t('form.email')}: ${email.value.trim()}`,
  ].join('\n');

  const href =
    `mailto:${CONTACT_EMAIL}` +
    `?subject=${encodeURIComponent(t('mail.subject'))}` +
    `&body=${encodeURIComponent(body)}`;

  window.location.href = href;
  formOk.hidden = false;
});

form.addEventListener('input', (event) => {
  const field = event.target.closest('.field');
  if (field && field.classList.contains('has-err')) {
    field.classList.remove('has-err');
    const err = field.querySelector('.err');
    if (err) err.textContent = '';
    event.target.removeAttribute('aria-invalid');
  }
});

/* ───────────────────────────── start ───────────────────────────── */

(function chooseLanguage() {
  let saved = null;
  try {
    saved = localStorage.getItem('twohomes.lang');
  } catch {
    /* private mode: fall back to the browser's own preference */
  }
  const prefersDanish = (navigator.language || '').toLowerCase().startsWith('da');
  setLang(saved || (prefersDanish ? 'da' : 'en'), { remember: false });
})();
