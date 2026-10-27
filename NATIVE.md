# Shipping Twohomes to the App Store and Google Play

The web app is wrapped with [Capacitor](https://capacitorjs.com), which runs the
existing `dist/` build inside a native shell. No rewrite: the same React code runs on
the web, on iOS and on Android, and a web deploy and an app release come from one
codebase.

```bash
npm run sync       # build the web app and copy it into both native projects
npm run android    # sync, then open the project in Android Studio
npm run ios        # sync, then open the project in Xcode (macOS only)
```

## The hard constraint: iOS needs a Mac

**iOS apps cannot be built, signed or submitted from Windows.** Xcode is macOS-only and
Apple provides no alternative. This is not a tooling gap that can be worked around.

The `ios/` project is scaffolded and committed, so it is ready the moment it reaches a
Mac. Three ways to get there, cheapest first:

| Route | Cost | Notes |
| --- | --- | --- |
| Cloud macOS CI — Codemagic, Bitrise, GitHub Actions macOS runners | free tiers, then usage-based | Push a tag, get a build. No hardware. The usual answer for a Windows developer. |
| Rented Mac — MacinCloud, MacStadium | ~€20–60/month | A real desktop when you need to debug something visual. |
| A used Mac mini | one-off | Cheapest over a couple of years if this keeps going. |

Android has no such restriction and builds entirely on Windows.

## What you still need to install

Neither platform compiles on this machine yet — there is no JDK and no Android SDK.

- **Android:** [Android Studio](https://developer.android.com/studio). It bundles the
  JDK and SDK and sets `ANDROID_HOME` for you. After installing, `npm run android`
  opens the project and the green run button puts it on a device or emulator.
- **iOS:** Xcode, on whichever Mac you end up using.

## Accounts

- **Apple Developer Program** — $99/year, and you cannot ship a TestFlight build or a
  release without it.
- **Google Play Console** — $25 once, for the life of the account.

Register the Apple one early: identity verification can take days, and for a company
(rather than an individual) it needs a D-U-N-S number, which takes longer.

## Before you submit: three things that will bite

### 1. Local storage is not durable in a webview — fix this first

The app keeps everything in `localStorage`. On the web that is a reasonable trade.
Inside a native webview it is not: **iOS evicts WKWebView local storage under storage
pressure**, and Android can clear it too. For an app holding the only copy of a family's
custody schedule and expense ledger, that is silent data loss at the worst possible
moment.

`@capacitor/preferences` is already installed. `src/lib/storage.ts` is the only file
that touches persistence, so the change is contained — but its API is async, and
`StoreProvider` currently loads state synchronously on mount, so the app needs a brief
loading state. Do this before any real user has data in it.

For the photo feed, go further: `@capacitor/camera` plus `@capacitor/filesystem` store
images as real files instead of base64 inside the same storage blob, which also removes
the ~5MB ceiling the README mentions.

### 2. Icons and a splash screen

`@capacitor/assets` is installed. Give it one 1024×1024 PNG and one splash image:

```bash
npx capacitor-assets generate --iconBackgroundColor '#faf8f4' --splashBackgroundColor '#faf8f4'
```

Both stores reject submissions without them.

### 3. The app id is permanent

`capacitor.config.ts` sets `appId: 'com.twohomes.app'`. **This cannot be changed after
the first publish** on either store without starting a new listing and losing every
install and review. If you own a domain, use its reverse form now.

## Store review, specific to this app

- **A privacy policy URL is mandatory** on both stores, even though nothing leaves the
  device. Say exactly that — it is a genuinely strong claim and reviewers like clarity.
- **Apple privacy nutrition labels / Google Data safety.** With no backend and no
  analytics, almost everything is "no data collected", which is the easiest version of
  this form you will ever fill in. It stops being true the day you add accounts.
- **Age rating: 4+ / Everyone.** Do *not* opt into Apple's Kids Category — it brings
  strict advertising and external-link rules, and this is a tool for parents, not a
  children's app, even though it holds information about children.
- **Account deletion** is required by Apple only if you offer account creation. You do
  not, yet. The day you add the backend in BUSINESS.md, you must also add a delete path.
- Apple rejects apps that are "just a repackaged website". This one works fully offline
  and holds its own data, so it qualifies — but that argument depends on fixing item 1.

## Worth weighing before you spend the $99

BUSINESS.md argues native should wait until web retention is proven, and that still
holds: a store listing does not create users, and you can test the whole product on the
web for nothing.

The honest counter-argument is **push notifications**. A reminder the evening before a
handover, with that child's bag list, is one of the genuinely useful paid features — and
it is unreliable on mobile web, especially iOS. If that feature is what you want to
test, native is the only way to test it.

A middle path costs nothing: the web build is already close to an installable PWA. Add a
manifest and a service worker and parents can add it to their home screen, offline, with
no store review and no developer account. That is a good way to find out whether anyone
keeps using it before paying Apple.
