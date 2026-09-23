[![CI](https://github.com/hamzahamidi/todo-list/actions/workflows/ci.yml/badge.svg)](https://github.com/hamzahamidi/todo-list/actions/workflows/ci.yml)
[![Deploy](https://github.com/hamzahamidi/todo-list/actions/workflows/deploy.yml/badge.svg)](https://github.com/hamzahamidi/todo-list/actions/workflows/deploy.yml)
[![Release](https://github.com/hamzahamidi/todo-list/actions/workflows/release.yml/badge.svg)](https://github.com/hamzahamidi/todo-list/actions/workflows/release.yml)
[![GitHub release](https://img.shields.io/github/release/hamzahamidi/todo-list.svg)](https://github.com/hamzahamidi/todo-list/releases/latest)
[![GitHub license](https://img.shields.io/github/license/hamzahamidi/todo-list.svg)](https://github.com/hamzahamidi/todo-list)

# Todo List

A todo list app built with Ionic, Angular and Capacitor on Firebase. It runs on the web
as an installable app, and every release ships an Android APK and an iOS IPA.

**Live at [hamidihamza.com/todo-list](https://hamidihamza.com/todo-list/).
Downloads on the [releases page](https://github.com/hamzahamidi/todo-list/releases/latest).**

- Google sign-in.
- Create, rename and delete lists.
- Add, edit, complete and delete tasks.
- Dictate a task by voice, in the native builds only.

Photos on tasks need Cloud Storage, which is not enabled on the Firebase project yet.
Sharing lists is being rebuilt.

## Stack

| | |
|---|---|
| UI | Ionic 9 (standalone components) |
| Framework | Angular 22 |
| Backend | Firebase Auth, Cloud Firestore and Cloud Storage (modular SDK with `rxfire`) |
| Native | Capacitor 8 (Android and iOS) |
| Build | Angular CLI |

# Getting started

Requires Node.js 24 or newer. The tests also need Java 21 or newer for the Firebase
emulators.

```
npm install
npm start
```

Navigate to `http://localhost:4200/`. The app reloads automatically when you change
a source file.

# Building the project

```
npm run build
```

Build artifacts are written to `www/`.

Run `npm run lint` to check the sources.

# Testing

The Firestore and Cloud Storage security rules live in `firestore.rules` and
`storage.rules`, and are tested against the Firebase emulators:

```
npm run test:rules
npm run test:services
```

`test:rules` checks every allow and deny path. `test:services` replays the
services' exact queries and writes as a signed in user under those rules.

# Deployment

Pushing to `master` runs [`deploy.yml`](.github/workflows/deploy.yml), which builds the
app and publishes it to GitHub Pages. The Pages source is set to GitHub Actions, so no
branch holds the built output.

The build is served from a subdirectory, so it is built with `--base-href /todo-list/`.
`index.html` is copied to `404.html` because GitHub Pages has no rewrite rule and the
router needs every path to reach the app shell.

The security rules are not part of that workflow. They deploy to the Firebase project
named in `.firebaserc` with:

```
npx firebase deploy --only firestore,storage
```

# Native builds

The native shells use [Capacitor](https://capacitorjs.com). `android/` and `ios/` are
generated and are not checked in. The scripts in `scripts/native/` apply the native
settings to a fresh project: the Android version numbers, the Google sign-in flag, the
Firebase config file, the iOS permission texts, the launcher icons from
`resources/icon.png` and the splash screens from `resources/splash.png` (light) and
`resources/icon.png` (dark). The release workflow sets the iOS version when it archives.

Android needs JDK 21, the Android SDK and jq:

```
npm ci
npx cap add android
VERSION=1.0.0 VERSION_CODE=1000000 scripts/native/configure-android.sh
npm run build
npx cap sync android
npx cap open android
```

iOS needs macOS with Xcode 26, CocoaPods, and the xcodeproj gem for the `ruby` on
`PATH`:

```
npm ci
npx cap add ios --packagemanager CocoaPods
scripts/native/configure-ios.sh
npm run build
npx cap sync ios
npx cap open ios
```

`google-services.json` belongs to the Firebase Android app `com.todo.list` on
`todo-list-f5305`, which has the release key's SHA-1 and SHA-256 registered. A local
debug build is signed with another key, so native Google sign-in needs that key's SHA-1
added in the Firebase console too. No Firebase iOS app exists yet, and Google is the
only sign-in method, so the iOS build cannot sign in.

# Releases

Pushing a `MAJOR.MINOR.PATCH` tag runs [`release.yml`](.github/workflows/release.yml).
It builds a signed APK on Ubuntu and an unsigned IPA on macOS, then publishes a GitHub
release with both files and a `SHA256SUMS` file. The tag must equal the `package.json`
version:

```
npm version patch
git push --atomic --follow-tags origin master
```

`.npmrc` makes `npm version` create bare tags such as `1.0.1`, like the older tags.

The APK is signed with the release key stored in the `ANDROID_KEYSTORE_BASE64` and
`ANDROID_KEYSTORE_PASSWORD` secrets, under the alias in the `ANDROID_KEY_ALIAS`
repository variable. Every release must use that key, or installed copies cannot update. The IPA is unsigned: install it with a
sideloading tool that re-signs it, such as AltStore or Sideloadly.

To rebuild a release without moving its tag, run
`gh workflow run release.yml --ref 1.0.1 -f publish=true`. A run from a branch builds
both files as workflow artifacts and publishes nothing.

# Project Planning

We use [ZenHub](https://zenhub.com) for project planning. The pipelines and milestones
live on the [ZenHub project page](https://app.zenhub.com/workspace/o/hamzahamidi/todo-list/).
