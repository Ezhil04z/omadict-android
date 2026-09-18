# OMADICT

A fast, offline-first English dictionary. Built for **Omarchy** and packaged as an
Android app with [Capacitor](https://capacitorjs.com/).

The whole lookup pipeline (definitions, synonyms, related words, and spelling
suggestions) ships **inside the app** — no internet required for the core search.

## Features

- **Bundled offline dictionary** — 3,000-word suggestion list and 1,050 entries
  (with pronunciations and definitions) baked into the APK. Works fully offline.
- **Did-you-mean & prefix suggestions** offline (`researh` → `research`), based on
  the bundled word list.
- **Online enrichment** — when the device is online the app adds Datamuse synonyms
  and related words and FreeDictionary definitions for words outside the bundle.
- **Word of the day** — 50 curated words on the home screen.
- **Favorites & history** — saved locally on the device.
- **16 color themes** — the default `omarchy` theme with 15 variants (stored in
  localStorage).
- **Pronunciation** — plays via the device's system text-to-speech engine.
- **Responsive** — mobile- and desktop-friendly single-page UI.

## Install the APK

Requirements: **Android 6.0+** (minSdk 23), with "install from unknown apps"
allowed.

1. Download `OMADICT-debug.apk` from the [repo root](https://github.com/Ezhil04z/omadict-android).
2. Open the downloaded file in your file manager, or on the download page tap the
   notification / "Open" prompt.
3. If prompted, allow your browser or file manager to **install unknown apps**
   (Settings → Apps → the app → *Install unknown apps*).
4. Install and open **OMADICT**.

> **Note:** this is a debug-signed build (fingerprint used exclusively for
> sideloading). It is unsigned for the Play Store and will never appear there.

## Build from source

Prerequisites: **Node.js 18+**, **Java 21**, and an **Android SDK** (API 35,
`ANDROID_HOME` set).

```sh
npm install
npm run apk        # builds web/ → www/, syncs with Capacitor, compiles the APK
```

The build script detects the Java runtime (or `JAVA_HOME`) automatically.
Output: `android/app/build/outputs/apk/debug/app-debug.apk`.

Individual steps:

```sh
node scripts/build.js      # (re)generates www/ incl. the bundled js/dict-data.js
npx cap sync android       # copies www/ into the Capacitor Android project
cd android && ./gradlew assembleDebug
```

## Project layout

```
android/   Capacitor/Android native wrapper (Gradle project, app id com.omadict.app)
web/       all of the app's HTML/CSS/JS source (the dictionary UI)
scripts/   build.js (bundles web/ → www/), rebuild-apk.sh (full APK build)
www/       generated output from scripts/build.js — do not edit (gitignored)
assets/    icons & splash screen sources
```

## How the offline data is generated

`scripts/build.js` reads the source dictionary data and emits `www/js/dict-data.js` — a single
`window.__OMADICT_OFFLINE` blob (3,000 words / 1,050 entries) that `web/js/app.js`
falls back to whenever the network is unreachable.