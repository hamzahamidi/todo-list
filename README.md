[![CI](https://github.com/hamzahamidi/todo-list/actions/workflows/ci.yml/badge.svg)](https://github.com/hamzahamidi/todo-list/actions/workflows/ci.yml)
[![Deploy](https://github.com/hamzahamidi/todo-list/actions/workflows/deploy.yml/badge.svg)](https://github.com/hamzahamidi/todo-list/actions/workflows/deploy.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/a884eb46aac726ed5c65/maintainability)](https://codeclimate.com/github/hamzahamidi/todo-list/maintainability)
[![GitHub release](https://img.shields.io/github/release/hamzahamidi/todo-list.svg)](https://github.com/hamzahamidi/todo-list/releases/latest)
[![GitHub license](https://img.shields.io/github/license/hamzahamidi/todo-list.svg)](https://github.com/hamzahamidi/todo-list)

# TODO-LIST IONIC FIREBASE PROJECT

A small Todo-List project built with Ionic and Firebase.

**Live at [hamidihamza.com/todo-list](https://hamidihamza.com/todo-list/).**

The application is able to do the following:

- CRUD Todo-List.
- CRUD Tasks/items.
- Installable web app.
- SSO Google.
- Share list via QR code.
- Upload image from Camera or Storage.
- Speech Recognition.

QR scanning and speech recognition rely on Capacitor plugins and are only available
in the native build.

## Stack

| | |
|---|---|
| UI | Ionic 9 (standalone components) |
| Framework | Angular 22 |
| Backend | Firebase Auth, Cloud Firestore and Cloud Storage (modular SDK with `rxfire`) |
| Native | Capacitor 8 |
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

# Running on Android

The native shell uses [Capacitor](https://capacitorjs.com). The `android/` directory
is generated and is not checked in:

```
npm run build
npx cap add android
npx cap sync
npx cap open android
```

`google-services.json` at the repository root must be copied to
`android/app/google-services.json` for Google sign-in to work, and the Firebase
Android app must have the signing certificate's SHA-1 registered.

Launcher icons and the splash screen are generated from `resources/icon.png` and
`resources/splash.png`:

```
npx @capacitor/assets generate --assetPath resources --android
```

# Project Planning

We use [ZenHub](https://zenhub.com) for project planning. The pipelines and milestones
live on the [ZenHub project page](https://app.zenhub.com/workspace/o/hamzahamidi/todo-list/).
