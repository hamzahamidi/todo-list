[![CI](https://github.com/hamzahamidi/todo-list/actions/workflows/ci.yml/badge.svg)](https://github.com/hamzahamidi/todo-list/actions/workflows/ci.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/a884eb46aac726ed5c65/maintainability)](https://codeclimate.com/github/hamzahamidi/todo-list/maintainability)
[![GitHub release](https://img.shields.io/github/release/hamzahamidi/todo-list.svg)](https://github.com/hamzahamidi/todo-list/releases/latest)
[![GitHub license](https://img.shields.io/github/license/hamzahamidi/todo-list.svg)](https://github.com/hamzahamidi/todo-list)

# TODO-LIST IONIC FIREBASE PROJECT

A small Todo-List project built with Ionic 9, Angular 22 and Firebase.
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

# Getting started

Requires Node.js 22 or newer.

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

# Project Planning

We use [ZenHub](https://zenhub.com) for project planning. Feel free to head over to the [Boards](https://github.com/hamzahamidi/todo-list#boards)
tab and have a look through our pipelines and milestones. Please note in order to view the Github ZenHub Boards tab you will need the [ZenHub
browser extension](https://www.zenhub.com/extension). Alternatively, to view the planning board without the extension visit our [ZenHub Project Page](https://app.zenhub.com/workspace/o/hamzahamidi/todo-list/)
![alt text](https://user-images.githubusercontent.com/22576950/36248044-666a782a-1236-11e8-862c-936d1b94a41e.png)
