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
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.cta': 'Request early access',

    'hero.kicker': 'For parents living apart',
    'hero.t1': 'One child.',
    'hero.t2': 'Two homes.',
    'hero.t3': 'One plan.',
    'hero.lead': 'A shared calendar and expense list for parents living apart. Where the children are this week, what is coming up and who paid for what, in one place both homes can see.',
    'hero.cta1': 'Request early access',
    'hero.cta2': 'See what it does',

    'mock.answer1': 'Mila is with',
    'mock.answer2': 'you',
    'mock.answer3': 'tonight.',

    'live.title': 'Live from the beta',
    'live.families': 'families helped',
    'live.familiesSub': 'households that have set up a rotation and kept it running',
    'live.active': 'active parents',
    'live.activeSub': 'opened Twohomes at least once in the last 30 days',
    'live.updated': 'Updated',
    'live.note': '· figures are placeholders until launch',
    'live.never': 'not yet',
    'live.now': 'just now',


    'service.kicker': 'The service',
    'service.title': 'The everyday things, in one place.',

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
    's4.body': 'A photo and a line from whichever home they are in. Plus one activity idea, every week.',
    's5.title': 'Kids',
    's5.body':
      'Allergies, school, doctor, and the list of things that have to travel between homes. Written once, visible to both.',

    'patterns.label': 'Set the rotation once',
    'patterns.custom': 'your own',
    'patterns.note': 'The pattern describes the agreement. Any single day can still be changed by hand.',

    'how.kicker': 'How it works',
    'how.title': 'Three steps to get started.',
    'how1.title': 'Set the pattern',
    'how1.body': 'Pick the rotation you already live by and the date it starts. The calendar fills itself in for every month ahead, holidays included.',
    'how2.title': 'Invite the other home, when it suits you',
    'how2.body': 'Both homes can sync, end-to-end encrypted, so a request lands on the other phone. A read-only link to next month is also an option. No account needed.',
    'how3.title': 'Then it runs quietly',
    'how3.body': 'A reminder the evening before every changeover, with that child\'s bag list. Costs added as they happen. A clear history for both homes.',
    'assure.title': 'Private by construction',
    'assure.body': 'Your children\'s photos, health notes and school details stay on your devices. What passes between two homes is encrypted end-to-end and travels through a relay that cannot read it.',

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
    'about.title': 'Made with the children in mind.',
    'about.lead': 'Twohomes is for parents living apart who would like the practical side of the week to take less effort. Every feature is judged by whether it makes the week quieter for the children.',
    'about.body': 'It is not made for court or for high-conflict cases. It is for two parents who mostly manage, and who would like the admin to take thirty seconds instead of an evening.',
    'p1.title': 'The child is the user.',
    'p1.body': 'Decisions are settled by what makes their week calmer.',
    'p2.title': 'Local-first.',
    'p2.body': 'Your data lives on your device. Sharing is a choice you make, screen by screen.',
    'p3.title': 'Neutral by design.',
    'p3.body': 'No read receipts, no scoreboard, no nudges.',
    'p4.title': 'Quiet on purpose.',
    'p4.body': 'Calendars and ledgers should be plain, fast and quiet.',
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
    'contact.lead': 'The private beta takes a small number of families at a time. Write a little about your rotation if you like, and we will get back to you.',
    'contact.k1': 'Email',
    'contact.k2': 'Reply time',
    'contact.v2': 'Within two working days',
    'contact.k3': 'Press & partners',

    'form.name': 'Your name',
    'form.namePh': 'Mette Jensen',
    'form.email': 'Email',
    'form.emailPh': 'you@example.com',
    'form.country': 'Country',
    'form.other': 'Somewhere else',
    'form.message': 'A little about your week',
    'form.messagePh': 'Two children, 2-2-3.',
    'form.submit': 'Request early access',
    'form.fine':
      'This opens your own mail app with the message ready to send — nothing is submitted to a server from this page.',
    'form.ok': 'Your mail app should be opening. If it did not, write to ' + CONTACT_EMAIL + '.',
    'err.name': 'Please tell us what to call you.',
    'err.email': 'That email address does not look right.',
    'err.message': 'A sentence or two is plenty.',
    'mail.subject': 'Early access — Twohomes',
    'mail.country': 'Co-parenting in',

    'a11y.glance': 'At a glance',
    'nav.faq': 'Good to know',
    'tick.one': 'Useful for one parent from day one',
    'tick.private': 'End-to-end encrypted between homes',
    'tick.patterns': '7 custody rotations, plus your own',
    'tick.holidays': 'School holidays already on the calendar',
    'why.kicker': 'Everyday life',
    'why.title': 'A quieter week, in both homes.',
    'why.lead': 'Many Danish children have two homes. Small things keep the week running: the swimming kit, the dentist, who picks up on Friday. Twohomes keeps them in one place, so they need less discussion.',
    'why.s1': 'of Danish 17-year-olds have parents who live apart.',
    'why.s1src': 'Danmarks Statistik, 2018',
    'why.s2': 'of Danish children can expect their parents to separate during childhood.',
    'why.s2src': 'ROCKWOOL Foundation',
    'f1.title': 'Today at a glance',
    'f1.b1': 'The same answer on both phones',
    'f1.b2': 'The next changeover: when and where',
    'f1.b3': 'One thing at a time, until you are done',
    'f2.title': 'A month both homes can see',
    'f2.b1': 'A swap request changes nothing until the other home agrees',
    'f2.b2': 'Every change shows who made it',
    'f2.b3': 'Nights counted for both homes',
    'f3.title': 'Shared costs, kept simple',
    'f3.b1': 'One balance, the same in both homes',
    'f3.b2': 'Boots, school trips and swimming fees in one list',
    'f3.b3': 'A clear record for both of you',
    'f4.title': 'A little of the week away',
    'f4.b1': 'Small things from each home, seen by both',
    'f4.b2': 'A suggestion, never a score',
    'f4.b3': 'No feed, no likes, nobody else watching',
    'f5.title': 'Their health and their things, in both homes',
    'f5.b1': "Neither parent has to ask for their own child's medical details",
    'f5.b2': 'A bag list for each changeover',
    'f5.b3': 'Doctor and school details always at hand',
    'faq.kicker': 'Practical details',
    'faq.title': 'Good to know.',
    'faq.q1': 'Using it on your own',
    'faq.a1': 'Twohomes works for one parent from day one. The other home can join whenever it suits, and nothing stops working if they do not.',
    'faq.q2': 'Privacy',
    'faq.a2': 'Your information is visible to you, and to the other home if you pair with them. What passes between the homes is encrypted end-to-end, so the relay in the middle cannot read it, and neither can we.',
    'faq.q3': 'Cost',
    'faq.a3': 'Free during the private beta. You would hear about any change first. One parent\'s access never depends on the other\'s payment.',
    'faq.q4': 'Your existing agreement',
    'faq.a4': 'Pick the rotation that matches it, or set your own. Any single day can still be changed by hand.',
    'faq.q5': 'Who it is for',
    'faq.a5': 'Parents who mostly manage day to day. It has no evidence logs or court exports. For a dispute, Familieretshuset or a family lawyer can help.',
    'faq.q6': 'Phones and languages',
    'faq.a6': 'iOS, Android and the web, in English, Danish and Polish.',
    'foot.photos': 'Photos: stock images from Pexels, shown for illustration.',
    'alt.heroDad': 'A father and his young daughter smiling together outdoors in autumn',
    'alt.heroMum': 'A mother kissing her laughing son on the cheek',
    'alt.why': 'A small child with a red backpack walking away along a path through the grass',
    'alt.today': 'A boy with a colourful backpack running along a pavement',
    'alt.calendar': "A laughing girl riding on her father's shoulders in a park",
    'alt.money': 'A father and daughter talking and laughing on a sofa at home',
    'alt.moments': 'A little girl with her head thrown back, laughing',
    'alt.kids': 'A girl in red glasses painting at a table',
    'alt.about': 'A mother and daughter hugging and smiling',
    'alt.contact': 'A mother and child hugging in a bright kitchen',
    'film.label': 'Demo video of the Twohomes app',
    'film.caption': 'The real app, one morning, in under a minute.',
    'shot.today': 'The Today screen: who the children are with, and a swap request waiting for an answer',
    'shot.calendar': 'The Calendar screen: November in two colours, with nights counted for each home',
    'shot.money': 'The Money screen: the balance between the homes and a list of shared costs',
    'shot.moments': 'The Moments screen: short notes from each home and an idea for the week',
    'shot.kids': 'The Children screen: school, doctor and allergies, and the things that travel between homes',
    'faq.q7': 'Backups',
    'faq.a7': 'Your data stays on your device. You can save an encrypted copy whenever you like, and take it with you if you leave.',
    'foot.line': 'A calm shared calendar and expense list for parents living apart.',
    'foot.legal': 'Designed in Denmark.',
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
    'nav.about': 'Om os',
    'nav.contact': 'Kontakt',
    'nav.cta': 'Få tidlig adgang',

    'hero.kicker': 'Til deleforældre',
    'hero.t1': 'Ét barn.',
    'hero.t2': 'To hjem.',
    'hero.t3': 'Én plan.',
    'hero.lead': 'En fælles kalender og udgiftsliste til forældre, der bor hver for sig. Hvor børnene er i denne uge, hvad der kommer, og hvem der har betalt hvad, samlet ét sted, som begge hjem kan se.',
    'hero.cta1': 'Få tidlig adgang',
    'hero.cta2': 'Se hvad den kan',

    'mock.answer1': 'Mila er hos',
    'mock.answer2': 'dig',
    'mock.answer3': 'i aften.',

    'live.title': 'Live fra betaen',
    'live.families': 'familier hjulpet',
    'live.familiesSub': 'husstande, der har sat en turnus op og holder den kørende',
    'live.active': 'aktive forældre',
    'live.activeSub': 'har åbnet Twohomes mindst én gang i de seneste 30 dage',
    'live.updated': 'Opdateret',
    'live.note': '· tallene er pladsholdere indtil lanceringen',
    'live.never': 'endnu ikke',
    'live.now': 'lige nu',


    'service.kicker': 'Tjenesten',
    'service.title': 'Hverdagens ting, samlet ét sted.',

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
    's4.body': 'Et billede og en linje fra det hjem, de er i. Og én idé til noget at lave, hver uge.',
    's5.title': 'Børn',
    's5.body':
      'Allergier, skole, læge og listen over ting, der skal med mellem hjemmene. Skrevet én gang, synligt for begge.',

    'patterns.label': 'Sæt ordningen op én gang',
    'patterns.custom': 'dit eget',
    'patterns.note': 'Mønstret beskriver aftalen. Enkelte dage kan altid rettes i hånden.',

    'how.kicker': 'Sådan virker det',
    'how.title': 'Tre trin for at komme i gang.',
    'how1.title': 'Sæt mønstret',
    'how1.body': 'Vælg den samværsordning, I allerede følger, og datoen den starter. Kalenderen udfylder sig selv for hver måned frem, helligdage med.',
    'how2.title': 'Inviter det andet hjem, når det passer',
    'how2.body': 'Begge hjem kan synkronisere, end-to-end-krypteret, så en anmodning lander på den anden telefon. Et link til næste måned, kun til at læse, er også en mulighed. Ingen konto nødvendig.',
    'how3.title': 'Så kører det stille og roligt',
    'how3.body': 'En påmindelse aftenen før hvert skifte, med barnets pakkeliste. Udgifter tilføjet, når de opstår. En klar historik for begge hjem.',
    'assure.title': 'Privat af konstruktion',
    'assure.body': 'Billederne af jeres børn, helbredsnoterne og skoleoplysningerne bliver på jeres egne enheder. Det, der går mellem to hjem, er end-to-end-krypteret og sendes gennem et relæ, der ikke kan læse det.',

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
    'about.title': 'Lavet med børnene for øje.',
    'about.lead': 'Twohomes er til forældre, der bor hver for sig, og som gerne vil have, at det praktiske i ugen fylder mindre. Hver funktion vurderes på, om den gør ugen roligere for børnene.',
    'about.body': 'Den er ikke lavet til retten eller til sager med høj konflikt. Den er til to forældre, der stort set klarer det, og som gerne vil have, at det administrative tager tredive sekunder i stedet for en aften.',
    'p1.title': 'Barnet er brugeren.',
    'p1.body': 'Beslutninger afgøres af, hvad der gør deres uge roligere.',
    'p2.title': 'Lokalt først.',
    'p2.body': 'Dine data bor på din egen enhed. Deling er et valg, du tager, skærm for skærm.',
    'p3.title': 'Neutral af konstruktion.',
    'p3.body': 'Ingen læsekvitteringer, ingen pointtavle, ingen skub.',
    'p4.title': 'Stille med vilje.',
    'p4.body': 'Kalendere og regnskaber skal være enkle, hurtige og stille.',
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
    'contact.lead': 'Den private beta tager et lille antal familier ad gangen. Skriv gerne lidt om jeres ordning, så vender vi tilbage.',
    'contact.k1': 'E-mail',
    'contact.k2': 'Svartid',
    'contact.v2': 'Inden for to hverdage',
    'contact.k3': 'Presse & partnere',

    'form.name': 'Dit navn',
    'form.namePh': 'Mette Jensen',
    'form.email': 'E-mail',
    'form.emailPh': 'dig@eksempel.dk',
    'form.country': 'Land',
    'form.other': 'Et andet sted',
    'form.message': 'Lidt om jeres uge',
    'form.messagePh': 'To børn, 2-2-3.',
    'form.submit': 'Få tidlig adgang',
    'form.fine':
      'Dette åbner dit eget mailprogram med beskeden klar til at sende — intet bliver sendt til en server fra denne side.',
    'form.ok': 'Dit mailprogram skulle åbne nu. Hvis ikke, så skriv til ' + CONTACT_EMAIL + '.',
    'err.name': 'Skriv, hvad vi skal kalde dig.',
    'err.email': 'Den e-mailadresse ser ikke rigtig ud.',
    'err.message': 'En sætning eller to er rigeligt.',
    'mail.subject': 'Tidlig adgang — Twohomes',
    'mail.country': 'Deler forældreskab i',

    'a11y.glance': 'Kort fortalt',
    'nav.faq': 'Godt at vide',
    'tick.one': 'Brugbar for én forælder fra dag ét',
    'tick.private': 'End-to-end-krypteret mellem hjemmene',
    'tick.patterns': '7 samværsordninger, plus jeres egen',
    'tick.holidays': 'Skoleferier er allerede i kalenderen',
    'why.kicker': 'Hverdagen',
    'why.title': 'En roligere uge, i begge hjem.',
    'why.lead': 'Mange danske børn har to hjem. Små ting holder ugen i gang: svømmetøjet, tandlægen, hvem der henter om fredagen. Twohomes samler dem ét sted, så de kræver mindre snak.',
    'why.s1': 'af danske 17-årige har forældre, der bor hver for sig.',
    'why.s1src': 'Danmarks Statistik, 2018',
    'why.s2': 'af danske børn kan forvente, at forældrene går fra hinanden i løbet af barndommen.',
    'why.s2src': 'ROCKWOOL Fonden',
    'f1.title': 'Dagen i dag, kort fortalt',
    'f1.b1': 'Det samme svar på begge telefoner',
    'f1.b2': 'Næste skifte: hvornår og hvor',
    'f1.b3': 'Én ting ad gangen, til du er færdig',
    'f2.title': 'En måned, begge hjem kan se',
    'f2.b1': 'Et bytteønske ændrer intet, før det andet hjem siger ja',
    'f2.b2': 'Hver ændring viser, hvem der lavede den',
    'f2.b3': 'Nætterne tælles for begge hjem',
    'f3.title': 'Fælles udgifter, enkelt holdt',
    'f3.b1': 'Én saldo, den samme i begge hjem',
    'f3.b2': 'Støvler, skoleture og svømning på én liste',
    'f3.b3': 'Et klart overblik for jer begge',
    'f4.title': 'Lidt af ugen hos den anden',
    'f4.b1': 'Små ting fra hvert hjem, som begge ser',
    'f4.b2': 'Et forslag, aldrig en pointtavle',
    'f4.b3': 'Intet feed, ingen likes, ingen andre der kigger med',
    'f5.title': 'Deres helbred og deres ting, i begge hjem',
    'f5.b1': 'Ingen forælder skal spørge om oplysninger om sit eget barns helbred',
    'f5.b2': 'En pakkeliste til hvert skifte',
    'f5.b3': 'Læge og skole altid ved hånden',
    'faq.kicker': 'Praktisk',
    'faq.title': 'Godt at vide.',
    'faq.q1': 'Brug den alene',
    'faq.a1': 'Twohomes virker for én forælder fra dag ét. Det andet hjem kan komme med, når det passer, og intet holder op med at virke, hvis det ikke sker.',
    'faq.q2': 'Privatliv',
    'faq.a2': 'Dine oplysninger kan ses af dig, og af det andet hjem, hvis I forbinder jer. Det, der går mellem hjemmene, er end-to-end-krypteret, så relæet i midten ikke kan læse det, og det kan vi heller ikke.',
    'faq.q3': 'Pris',
    'faq.a3': 'Gratis i den private beta. Du hører det først, hvis det ændrer sig. Den ene forælders adgang afhænger aldrig af den andens betaling.',
    'faq.q4': 'Jeres nuværende aftale',
    'faq.a4': 'Vælg den ordning, der passer, eller lav jeres egen. Enkelte dage kan altid rettes i hånden.',
    'faq.q5': 'Hvem den er til',
    'faq.a5': 'Forældre, der stort set får hverdagen til at fungere. Der er ingen bevislogge eller udtræk til retten. Ved en tvist kan Familieretshuset eller en familieadvokat hjælpe.',
    'faq.q6': 'Telefoner og sprog',
    'faq.a6': 'iOS, Android og web, på engelsk, dansk og polsk.',
    'foot.photos': 'Fotos: stockbilleder fra Pexels, brugt som illustration.',
    'alt.heroDad': 'En far og hans lille datter, der smiler sammen udendørs om efteråret',
    'alt.heroMum': 'En mor, der kysser sin grinende søn på kinden',
    'alt.why': 'Et lille barn med rød rygsæk, der går væk ad en sti gennem græsset',
    'alt.today': 'En dreng med farverig rygsæk, der løber hen ad et fortov',
    'alt.calendar': 'En grinende pige, der rider på sin fars skuldre i en park',
    'alt.money': 'En far og datter, der snakker og griner i en sofa derhjemme',
    'alt.moments': 'En lille pige, der griner med hovedet kastet bagover',
    'alt.kids': 'En pige med røde briller, der maler ved et bord',
    'alt.about': 'En mor og datter, der krammer og smiler',
    'alt.contact': 'En mor og et barn, der krammer i et lyst køkken',
    'film.label': 'Demovideo af Twohomes-appen',
    'film.caption': 'Den rigtige app, en morgen, på under et minut.',
    'shot.today': 'Skærmen I dag: hvem børnene er hos, og et bytteønske, der venter på svar',
    'shot.calendar': 'Skærmen Kalender: november i to farver, med nætter talt for hvert hjem',
    'shot.money': 'Skærmen Penge: saldoen mellem hjemmene og en liste over fælles udgifter',
    'shot.moments': 'Skærmen Øjeblikke: korte noter fra hvert hjem og en idé til ugen',
    'shot.kids': 'Skærmen Børn: skole, læge og allergier, og de ting, der skal med mellem hjemmene',
    'faq.q7': 'Sikkerhedskopi',
    'faq.a7': 'Dine data bliver på din enhed. Du kan gemme en krypteret kopi, når du vil, og tage den med, hvis du stopper.',
    'foot.line': 'En rolig fælles kalender og udgiftsliste til deleforældre.',
    'foot.legal': 'Designet i Danmark.',
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
  const film = document.getElementById('film');
  const suffix = next === 'da' ? '-da' : '';
  film.poster = `images/video-poster${suffix}.webp`;
  film.src = `video/twohomes-demo${suffix}.mp4`;
  document.querySelectorAll('[data-screen]').forEach((el) => {
    el.src = `images/screens/${next}/${el.dataset.screen}.webp`;
  });
  document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
    const value = t(el.dataset.i18nAlt);
    if (value) el.alt = value;
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
