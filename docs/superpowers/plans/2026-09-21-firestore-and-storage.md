# Firestore and Cloud Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move lists, items and photos off Realtime Database onto Firestore and Cloud Storage, behind security rules that live in the repository and have tests.

**Architecture:** One `lists/{listId}` document owns its membership, so a list exists exactly once and cannot go stale. Items are a subcollection. Photos are objects in Cloud Storage at `lists/{listId}/{itemId}/{filename}`, and the item stores only the path. Storage rules read the list document through cross-service `firestore.get()`, so membership is never duplicated into the storage path.

**Tech Stack:** Firebase JS SDK 12.19.0 (modular), `rxfire` 6.2.0, Firebase Emulator Suite via `firebase-tools` 15.30.2, `@firebase/rules-unit-testing` 5.0.2, Node 26 built-in test runner with native TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-21-firebase-platform-roadmap-design.md`

## Global Constraints

- Ionic imports come from `@ionic/angular`. The path `@ionic/angular/standalone` does not exist in Ionic 9.
- Standalone components only, `ChangeDetectionStrategy.OnPush`, `inject()`, signals, and the built-in control flow `@if` and `@for`.
- TypeScript `strict: true` and `strictTemplates: true`. No `any`, no non-null assertion, no `as` cast used to silence a real mismatch.
- The default is no code comment. Add one only for an invariant, an external contract, a compatibility constraint or an intentional limitation. A file over 5% comment lines fails the pre-push hook.
- No dash characters as punctuation in prose, commit messages or pull request bodies. Hyphens inside compound words are fine.
- Conventional commit subjects, 72 characters or fewer. No agent attribution lines.
- `npx ng build`, `npx ng lint` and `npx tsc -p tsconfig.app.json --noEmit` must be clean before the final commit of the branch.
- Firebase project id is `m2gi-ionic-21b7b`. The web API key in `src/environments/environment.ts` is a project identifier, not a secret, and stays where it is.
- Existing production data is disposable. Write no migration code.

## Out of scope for this plan

Sharing is rebuilt in the next plan. This plan lands the schema that supports it, but every list created here has exactly one member, its owner. The two sharing pages keep rendering and show their empty state. Do not delete them.

Also out of scope: Sign in with Apple, Facebook, App Check, account deletion, and the native builds. Each gets its own plan.

## File structure

| File | Responsibility |
|---|---|
| `firebase.json` | Emulator ports and rules file locations |
| `.firebaserc` | Project alias |
| `firestore.rules` | Who may read and write lists and items |
| `firestore.indexes.json` | Index declarations |
| `storage.rules` | Who may read and write photo objects |
| `test/helpers/emulator.ts` | Shared test environment setup and teardown |
| `test/rules/firestore-lists.test.ts` | Rules tests for list documents |
| `test/rules/firestore-items.test.ts` | Rules tests for the items subcollection |
| `test/rules/storage.test.ts` | Rules tests for photo objects |
| `src/app/models/todo-list.model.ts` | The `TodoList` and `Item` shapes |
| `src/app/core/firebase.providers.ts` | Provides `Firestore` and `FirebaseStorage` |
| `src/app/core/todo-list.service.ts` | Lists and items on Firestore |
| `src/app/core/photo.service.ts` | Upload and fetch photo bytes |
| `src/app/core/share-list.service.ts` | Membership reads only |

---

### Task 1: Emulator suite and rules test harness

**Files:**
- Create: `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`
- Create: `test/helpers/emulator.ts`, `test/rules/smoke.test.ts`
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: `withTestEnv(fn: (env: RulesTestEnvironment) => Promise<void>): Promise<void>` from `test/helpers/emulator.ts`. Every later rules task uses it.

- [ ] **Step 1: Install the test dependencies**

```bash
npm install --save-dev firebase-tools@15.30.2 @firebase/rules-unit-testing@5.0.2
```

- [ ] **Step 2: Write the Firebase config files**

`.firebaserc`:

```json
{
  "projects": {
    "default": "m2gi-ionic-21b7b"
  }
}
```

`firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "auth": { "port": 9099 },
    "ui": { "enabled": true, "port": 4400 },
    "singleProjectMode": true
  }
}
```

`firestore.indexes.json`:

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

`firestore.rules`, denying everything so the smoke test has something true to assert:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

`storage.rules`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 3: Write the test helper**

Create `test/helpers/emulator.ts`:

```ts
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

export async function withTestEnv(
  fn: (env: RulesTestEnvironment) => Promise<void>,
): Promise<void> {
  const env = await initializeTestEnvironment({
    projectId: 'demo-todo-list',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
    storage: {
      rules: readFileSync('storage.rules', 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  });
  try {
    await env.clearFirestore();
    await env.clearStorage();
    await fn(env);
  } finally {
    await env.cleanup();
  }
}
```

- [ ] **Step 4: Write the smoke test**

Create `test/rules/smoke.test.ts`:

```ts
import { test } from 'node:test';
import { assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc } from 'firebase/firestore';
import { withTestEnv } from '../helpers/emulator.ts';

test('the default rules deny an unauthenticated read', async () => {
  await withTestEnv(async (env) => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'lists/anything')));
  });
});
```

- [ ] **Step 5: Add the scripts**

Add to `scripts` in `package.json`:

```json
"emulators": "firebase emulators:start --only firestore,storage,auth",
"test:rules": "firebase emulators:exec --only firestore,storage \"node --test 'test/rules/**/*.test.ts'\""
```

Node 26 throws `Cannot find module` on a bare directory argument to `node --test`, so the script passes a glob. `clearStorage()` sits beside `clearFirestore()` because a successful upload in one test would otherwise survive into every later test of the same run.

- [ ] **Step 6: Run the tests**

Run: `npm run test:rules`
Expected: `tests 1`, `pass 1`. The emulator starts, the deny-all rules reject the read, and `assertFails` is satisfied.

- [ ] **Step 7: Ignore the emulator artifacts**

Append to `.gitignore`:

```
# Firebase emulator
/firebase-debug.log
/firestore-debug.log
/storage-debug.log
/ui-debug.log
```

- [ ] **Step 8: Commit**

```bash
git add firebase.json .firebaserc firestore.rules storage.rules firestore.indexes.json test package.json package-lock.json .gitignore
git commit -m "test: add the emulator suite and a rules test harness"
```

---

### Task 2: The new document shapes

**Files:**
- Modify: `src/app/models/todo-list.model.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `TodoList`, `Item`, `newItem()`. Every later task depends on these exact names.

- [ ] **Step 1: Replace the model file**

`src/app/models/todo-list.model.ts` becomes:

```ts
export interface Item {
  id: string;
  name: string;
  state: boolean;
  description: string;
  date: number;
  photoPath?: string;
}

export interface TodoList {
  id: string;
  ownerUid: string;
  name: string;
  date: number;
  memberUids: string[];
  joinedAt: Record<string, number>;
}

export function newItem(): Omit<Item, 'id'> {
  return { name: '', state: false, description: '', date: Date.now() };
}
```

`image` is replaced by `photoPath`. `items` leaves `TodoList` entirely, because items are a subcollection and are never embedded in the list document.

- [ ] **Step 2: Confirm the type errors appear where expected**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: FAIL, with errors in `todo-list.service.ts`, `share-list.service.ts`, `details.page.ts`, `item-details.modal.ts` and the templates reading `item.image` or `todoList.items`. That list is the work of tasks 6 through 10. Do not fix them now.

- [ ] **Step 3: Commit**

```bash
git add src/app/models/todo-list.model.ts
git commit -m "feat: reshape the list and item models for Firestore"
```

The branch build is red from here until task 10. That is intended and the branch is not merged before task 11.

---

### Task 3: Firestore rules for list documents

**Files:**
- Modify: `firestore.rules`
- Create: `test/rules/firestore-lists.test.ts`

**Interfaces:**
- Consumes: `withTestEnv` from task 1, the `TodoList` shape from task 2.
- Produces: the `isSelfRemoval()` rules helper, used again in the next plan.

- [ ] **Step 1: Write the failing tests**

Create `test/rules/firestore-lists.test.ts`:

```ts
import { test } from 'node:test';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { withTestEnv } from '../helpers/emulator.ts';

const OWNER = 'owner-uid';
const MEMBER = 'member-uid';
const STRANGER = 'stranger-uid';

function listDoc(ownerUid: string, memberUids: string[]) {
  const joinedAt: Record<string, number> = {};
  memberUids.forEach((uid, i) => (joinedAt[uid] = 1000 + i));
  return { ownerUid, name: 'Groceries', date: 1000, memberUids, joinedAt };
}

async function seed(env: Parameters<Parameters<typeof withTestEnv>[0]>[0]) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(
      doc(ctx.firestore(), 'lists/list-1'),
      listDoc(OWNER, [OWNER, MEMBER]),
    );
  });
}

test('a member reads the list', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertSucceeds(getDoc(doc(db, 'lists/list-1')));
  });
});

test('a stranger cannot read the list', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(STRANGER).firestore();
    await assertFails(getDoc(doc(db, 'lists/list-1')));
  });
});

test('the owner renames the list', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(OWNER).firestore();
    await assertSucceeds(updateDoc(doc(db, 'lists/list-1'), { name: 'Fruit' }));
  });
});

test('a member cannot rename the list', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertFails(updateDoc(doc(db, 'lists/list-1'), { name: 'Fruit' }));
  });
});

test('a member cannot promote themselves to owner', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertFails(updateDoc(doc(db, 'lists/list-1'), { ownerUid: MEMBER }));
  });
});

test('a member cannot add a stranger', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertFails(
      updateDoc(doc(db, 'lists/list-1'), {
        memberUids: [OWNER, MEMBER, STRANGER],
        [`joinedAt.${STRANGER}`]: 9999,
      }),
    );
  });
});

test('a member removes themselves', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'lists/list-1'), {
        memberUids: [OWNER],
        joinedAt: { [OWNER]: 1000 },
      }),
    );
  });
});

test('a member cannot remove somebody else', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertFails(
      updateDoc(doc(db, 'lists/list-1'), {
        memberUids: [MEMBER],
        joinedAt: { [MEMBER]: 1001 },
      }),
    );
  });
});

test('creating a list with somebody else as owner fails', async () => {
  await withTestEnv(async (env) => {
    const db = env.authenticatedContext(OWNER).firestore();
    await assertFails(
      setDoc(doc(db, 'lists/list-2'), listDoc(STRANGER, [STRANGER])),
    );
  });
});

test('creating a list pre-loaded with another member fails', async () => {
  await withTestEnv(async (env) => {
    const db = env.authenticatedContext(OWNER).firestore();
    await assertFails(
      setDoc(doc(db, 'lists/list-3'), listDoc(OWNER, [OWNER, STRANGER])),
    );
  });
});

test('the owner creates a list with only themselves', async () => {
  await withTestEnv(async (env) => {
    const db = env.authenticatedContext(OWNER).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'lists/list-4'), listDoc(OWNER, [OWNER])),
    );
  });
});

test('only the owner deletes the list', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const member = env.authenticatedContext(MEMBER).firestore();
    await assertFails(deleteDoc(doc(member, 'lists/list-1')));
    const owner = env.authenticatedContext(OWNER).firestore();
    await assertSucceeds(deleteDoc(doc(owner, 'lists/list-1')));
  });
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npm run test:rules`
Expected: the four `assertSucceeds` tests fail, because the rules still deny everything. The `assertFails` tests pass for the wrong reason, which the next step corrects.

- [ ] **Step 3: Write the rules**

Replace `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function isMember(list) {
      return signedIn() && request.auth.uid in list.memberUids;
    }

    match /lists/{listId} {
      function unchanged(field) {
        return request.resource.data[field] == resource.data[field];
      }

      function isSelfRemoval() {
        return signedIn()
          && request.auth.uid in resource.data.memberUids
          && request.auth.uid != resource.data.ownerUid
          && unchanged('ownerUid')
          && unchanged('name')
          && request.resource.data.memberUids ==
             resource.data.memberUids.removeAll([request.auth.uid])
          && request.resource.data.joinedAt.keys().toSet() ==
             resource.data.joinedAt.keys().toSet().difference([request.auth.uid].toSet());
      }

      allow read: if isMember(resource.data);

      allow create: if signedIn()
        && request.resource.data.ownerUid == request.auth.uid
        && request.resource.data.memberUids == [request.auth.uid]
        && request.resource.data.joinedAt.keys() == [request.auth.uid];

      allow delete: if signedIn() && request.auth.uid == resource.data.ownerUid;

      allow update: if (signedIn()
                        && request.auth.uid == resource.data.ownerUid
                        && unchanged('ownerUid'))
                    || isSelfRemoval();
    }
  }
}
```

`isSelfRemoval()` is the sharp one. It permits exactly one diff: the caller drops out of both `memberUids` and `joinedAt` and changes nothing else. An owner cannot use it, because the owner leaving would orphan the list.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npm run test:rules`
Expected: 13 tests, 13 pass. That is the 12 above plus the smoke test from task 1.

- [ ] **Step 5: Commit**

```bash
git add firestore.rules test/rules/firestore-lists.test.ts
git commit -m "feat: add Firestore rules for list documents"
```

---

### Task 4: Firestore rules for the items subcollection

**Files:**
- Modify: `firestore.rules`
- Create: `test/rules/firestore-items.test.ts`

**Interfaces:**
- Consumes: `withTestEnv`, the list rules from task 3.
- Produces: nothing new.

- [ ] **Step 1: Write the failing tests**

Create `test/rules/firestore-items.test.ts`:

```ts
import { test } from 'node:test';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { withTestEnv } from '../helpers/emulator.ts';

const OWNER = 'owner-uid';
const MEMBER = 'member-uid';
const STRANGER = 'stranger-uid';

const ITEM = {
  name: 'Milk',
  state: false,
  description: '',
  date: 1000,
};

async function seed(env: Parameters<Parameters<typeof withTestEnv>[0]>[0]) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'lists/list-1'), {
      ownerUid: OWNER,
      name: 'Groceries',
      date: 1000,
      memberUids: [OWNER, MEMBER],
      joinedAt: { [OWNER]: 1000, [MEMBER]: 1001 },
    });
    await setDoc(doc(db, 'lists/list-1/items/item-1'), ITEM);
  });
}

test('a member reads an item', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertSucceeds(getDoc(doc(db, 'lists/list-1/items/item-1')));
  });
});

test('a stranger cannot read an item', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(STRANGER).firestore();
    await assertFails(getDoc(doc(db, 'lists/list-1/items/item-1')));
  });
});

test('the owner writes an item', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(OWNER).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'lists/list-1/items/item-2'), { ...ITEM, name: 'Eggs' }),
    );
  });
});

test('a read-only member cannot write an item', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertFails(
      setDoc(doc(db, 'lists/list-1/items/item-3'), { ...ITEM, name: 'Bread' }),
    );
  });
});

test('an item under a missing list is denied', async () => {
  await withTestEnv(async (env) => {
    const db = env.authenticatedContext(OWNER).firestore();
    await assertFails(getDoc(doc(db, 'lists/nope/items/item-1')));
  });
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npm run test:rules`
Expected: the three `assertSucceeds` tests in this file fail. Nothing matches the items path yet, so every request is denied.

- [ ] **Step 3: Add the items rules**

Inside `match /lists/{listId} { ... }` in `firestore.rules`, after the `allow update` line, add:

```
      match /items/{itemId} {
        function parent() {
          return get(/databases/$(database)/documents/lists/$(listId)).data;
        }

        allow read: if isMember(parent());
        allow write: if signedIn() && request.auth.uid == parent().ownerUid;
      }
```

`get()` on a missing document raises an error, which denies the request. That is the behaviour the last test asserts.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npm run test:rules`
Expected: 18 tests, 18 pass.

- [ ] **Step 5: Commit**

```bash
git add firestore.rules test/rules/firestore-items.test.ts
git commit -m "feat: add Firestore rules for the items subcollection"
```

---

### Task 5: Cross-service Storage rules for photos

**Files:**
- Modify: `storage.rules`
- Create: `test/rules/storage.test.ts`

**Interfaces:**
- Consumes: `withTestEnv`, the list documents from task 3.
- Produces: the object path convention `lists/{listId}/{itemId}/{filename}`, which task 8 writes to.

- [ ] **Step 1: Write the failing tests**

Create `test/rules/storage.test.ts`:

```ts
import { test } from 'node:test';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getBytes } from 'firebase/storage';
import { withTestEnv } from '../helpers/emulator.ts';

const OWNER = 'owner-uid';
const MEMBER = 'member-uid';
const STRANGER = 'stranger-uid';
const PATH = 'lists/list-1/item-1/photo.jpg';
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x01]);
const META = { contentType: 'image/jpeg' };

async function seed(env: Parameters<Parameters<typeof withTestEnv>[0]>[0]) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'lists/list-1'), {
      ownerUid: OWNER,
      name: 'Groceries',
      date: 1000,
      memberUids: [OWNER, MEMBER],
      joinedAt: { [OWNER]: 1000, [MEMBER]: 1001 },
    });
    await uploadBytes(ref(ctx.storage(), PATH), JPEG, META);
  });
}

test('the owner uploads a photo', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const storage = env.authenticatedContext(OWNER).storage();
    await assertSucceeds(
      uploadBytes(ref(storage, 'lists/list-1/item-2/photo.jpg'), JPEG, META),
    );
  });
});

test('a member reads a photo', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const storage = env.authenticatedContext(MEMBER).storage();
    await assertSucceeds(getBytes(ref(storage, PATH)));
  });
});

test('a stranger cannot read a photo', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const storage = env.authenticatedContext(STRANGER).storage();
    await assertFails(getBytes(ref(storage, PATH)));
  });
});

test('a read-only member cannot upload', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const storage = env.authenticatedContext(MEMBER).storage();
    await assertFails(
      uploadBytes(ref(storage, 'lists/list-1/item-9/photo.jpg'), JPEG, META),
    );
  });
});

test('a non-image upload is rejected', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const storage = env.authenticatedContext(OWNER).storage();
    await assertFails(
      uploadBytes(ref(storage, 'lists/list-1/item-4/note.txt'), JPEG, {
        contentType: 'text/plain',
      }),
    );
  });
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npm run test:rules`
Expected: the two `assertSucceeds` tests in this file fail against the deny-all storage rules.

- [ ] **Step 3: Write the Storage rules**

Replace `storage.rules`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /lists/{listId}/{itemId}/{fileName} {
      function list() {
        return firestore.get(/databases/(default)/documents/lists/$(listId)).data;
      }

      allow read: if request.auth != null
        && request.auth.uid in list().memberUids;

      allow write: if request.auth != null
        && request.auth.uid == list().ownerUid
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

Two traps this avoids. The official example on the Firebase docs page prints `request.auth.id`, which is not a field and denies every request; the field is `request.auth.uid`. And a rules evaluation may touch at most two Firestore documents, which is why the helper reads the list once rather than walking to the item.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npm run test:rules`
Expected: 23 tests, 23 pass.

- [ ] **Step 5: Note the production IAM grant**

Cross-service rules need the role `roles/firebaserules.firestoreServiceAgent`. The emulator does not enforce it, so the tests pass without it. The Firebase console prompts for it the first time these rules are deployed. Record this in the pull request body; do not deploy in this task.

- [ ] **Step 6: Commit**

```bash
git add storage.rules test/rules/storage.test.ts
git commit -m "feat: gate photo objects on Firestore list membership"
```

---

### Task 6: Provide Firestore and Cloud Storage

**Files:**
- Modify: `src/app/core/firebase.providers.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `FIRESTORE` and `FIREBASE_STORAGE` injection tokens. `FIREBASE_DATABASE` is removed, so tasks 7 and 9 must stop importing it.

- [ ] **Step 1: Replace the providers file**

`src/app/core/firebase.providers.ts` becomes:

```ts
import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { environment } from '../../environments/environment';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('firebase.app');
export const FIREBASE_AUTH = new InjectionToken<Auth>('firebase.auth');
export const FIRESTORE = new InjectionToken<Firestore>('firebase.firestore');
export const FIREBASE_STORAGE = new InjectionToken<FirebaseStorage>('firebase.storage');

export function provideFirebase(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: FIREBASE_APP,
      useFactory: () => initializeApp(environment.firebase),
    },
    {
      provide: FIREBASE_AUTH,
      useFactory: (app: FirebaseApp) => getAuth(app),
      deps: [FIREBASE_APP],
    },
    {
      provide: FIRESTORE,
      useFactory: (app: FirebaseApp) => getFirestore(app),
      deps: [FIREBASE_APP],
    },
    {
      provide: FIREBASE_STORAGE,
      useFactory: (app: FirebaseApp) => getStorage(app),
      deps: [FIREBASE_APP],
    },
  ]);
}
```

- [ ] **Step 2: Point the auth service at Firestore**

`src/app/core/auth.service.ts` writes the profile with `ref` and `set` from `firebase/database`. Replace those two imports with `doc` and `setDoc` from `firebase/firestore`, swap `FIREBASE_DATABASE` for `FIRESTORE`, and change `persistProfile` to:

```ts
  private async persistProfile(credential: UserCredential): Promise<User> {
    const profile = toProfile(credential.user);
    await setDoc(doc(this.db, 'users', profile.uid), profile);
    return profile;
  }
```

- [ ] **Step 3: Add the users rule**

Inside `match /databases/{database}/documents { ... }` in `firestore.rules`, before `match /lists/{listId}`, add:

```
      match /users/{userId} {
        allow read: if signedIn();
        allow write: if signedIn() && request.auth.uid == userId;
      }
```

A profile is readable by any signed-in user because the sharing UI shows the name and photo of the person you share with. Only its owner writes it.

- [ ] **Step 4: Add a rules test for profiles**

Append to `test/rules/firestore-lists.test.ts`:

```ts
test('a user writes only their own profile', async () => {
  await withTestEnv(async (env) => {
    const mine = env.authenticatedContext(OWNER).firestore();
    await assertSucceeds(
      setDoc(doc(mine, 'users/owner-uid'), { uid: OWNER, email: 'a@b.c' }),
    );
    await assertFails(
      setDoc(doc(mine, 'users/member-uid'), { uid: MEMBER, email: 'x@y.z' }),
    );
  });
});
```

- [ ] **Step 5: Run the rules tests**

Run: `npm run test:rules`
Expected: 24 tests, 24 pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/core/firebase.providers.ts src/app/core/auth.service.ts firestore.rules test/rules/firestore-lists.test.ts
git commit -m "feat: provide Firestore and Cloud Storage in place of RTDB"
```

---

### Task 7: TodoListService on Firestore

**Files:**
- Rewrite: `src/app/core/todo-list.service.ts`
- Create: `test/services/todo-list.service.test.ts`

**Interfaces:**
- Consumes: `FIRESTORE` from task 6, `TodoList` and `Item` from task 2.
- Produces, and tasks 9 and 10 call exactly these:

```ts
lists$(uid: string): Observable<TodoList[]>
list$(listId: string): Observable<TodoList | null>
items$(listId: string): Observable<Item[]>
createList(ownerUid: string, name: string): Promise<string>
renameList(listId: string, name: string): Promise<void>
deleteList(listId: string): Promise<void>
addItem(listId: string, item: Omit<Item, 'id'>): Promise<string>
updateItem(listId: string, item: Item): Promise<void>
deleteItem(listId: string, itemId: string): Promise<void>
```

`ownerUid` disappears from every signature except `createList` and `lists$`, because a list id is now globally unique rather than nested under a user.

- [ ] **Step 1: Write the failing test**

Create `test/services/todo-list.service.test.ts`. It exercises the Firestore calls directly against the emulator rather than through Angular dependency injection, which keeps the test free of a TestBed:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

test('a created list carries its owner as its only member', async () => {
  const app = initializeApp({ projectId: 'demo-todo-list' }, `t-${Date.now()}`);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);

  const uid = 'owner-uid';
  const created = await addDoc(collection(db, 'lists'), {
    ownerUid: uid,
    name: 'Groceries',
    date: Date.now(),
    memberUids: [uid],
    joinedAt: { [uid]: Date.now() },
  });

  const snap = await getDoc(doc(db, 'lists', created.id));
  const data = snap.data();
  assert.ok(data);
  assert.deepEqual(data.memberUids, [uid]);
  assert.equal(data.ownerUid, uid);

  const mine = await getDocs(
    query(collection(db, 'lists'), where('memberUids', 'array-contains', uid)),
  );
  assert.equal(mine.size, 1);

  await deleteApp(app);
});
```

Add a script to `package.json`:

```json
"test:services": "firebase emulators:exec --only firestore,storage \"node --test test/services/\""
```

- [ ] **Step 2: Run it and watch it pass**

Run: `npm run test:services`
Expected: 1 test, 1 pass. This test proves the query shape the service depends on, so it passes before the service exists. Its value is catching a later schema change that breaks `array-contains`.

- [ ] **Step 3: Rewrite the service**

`src/app/core/todo-list.service.ts` becomes:

```ts
import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { collectionData, docData } from 'rxfire/firestore';
import { Observable } from 'rxjs';
import { Item, TodoList } from '../models';
import { FIRESTORE } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class TodoListService {
  private readonly db = inject(FIRESTORE);

  lists$(uid: string): Observable<TodoList[]> {
    return collectionData(
      query(collection(this.db, 'lists'), where('memberUids', 'array-contains', uid)),
      { idField: 'id' },
    ) as Observable<TodoList[]>;
  }

  list$(listId: string): Observable<TodoList | null> {
    return docData(doc(this.db, 'lists', listId), { idField: 'id' }) as Observable<
      TodoList | null
    >;
  }

  items$(listId: string): Observable<Item[]> {
    return collectionData(collection(this.db, 'lists', listId, 'items'), {
      idField: 'id',
    }) as Observable<Item[]>;
  }

  async createList(ownerUid: string, name: string): Promise<string> {
    const now = Date.now();
    const created = await addDoc(collection(this.db, 'lists'), {
      ownerUid,
      name,
      date: now,
      memberUids: [ownerUid],
      joinedAt: { [ownerUid]: now },
    });
    return created.id;
  }

  renameList(listId: string, name: string): Promise<void> {
    return updateDoc(doc(this.db, 'lists', listId), { name });
  }

  deleteList(listId: string): Promise<void> {
    return deleteDoc(doc(this.db, 'lists', listId));
  }

  async addItem(listId: string, item: Omit<Item, 'id'>): Promise<string> {
    const created = await addDoc(collection(this.db, 'lists', listId, 'items'), item);
    return created.id;
  }

  updateItem(listId: string, item: Item): Promise<void> {
    const { id, ...rest } = item;
    return setDoc(doc(this.db, 'lists', listId, 'items', id), rest);
  }

  deleteItem(listId: string, itemId: string): Promise<void> {
    return deleteDoc(doc(this.db, 'lists', listId, 'items', itemId));
  }
}
```

`deleteList` removes the list document only. Firestore does not cascade to a subcollection, so the items of a deleted list are orphaned. Deleting them needs a Cloud Function, which belongs to the account lifecycle plan. Record the gap in the pull request body.

- [ ] **Step 4: Check the types**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: still FAIL, now only in `share-list.service.ts`, the pages and the templates. `todo-list.service.ts` itself must be clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/todo-list.service.ts test/services/todo-list.service.test.ts package.json
git commit -m "feat: move lists and items onto Firestore"
```

---

### Task 8: PhotoService on Cloud Storage

**Files:**
- Create: `src/app/core/photo.service.ts`
- Modify: `src/app/core/index.ts`
- Create: `test/services/photo.service.test.ts`

**Interfaces:**
- Consumes: `FIREBASE_STORAGE` from task 6, the path convention from task 5.
- Produces:

```ts
upload(listId: string, itemId: string, dataUrl: string): Promise<string>
objectUrl(photoPath: string): Promise<string>
remove(photoPath: string): Promise<void>
```

`upload` returns the storage path to store on the item. `objectUrl` returns a blob URL for an `img` tag, and the caller revokes it.

- [ ] **Step 1: Write the failing test**

Create `test/services/photo.service.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  connectStorageEmulator,
  getStorage,
  ref,
  uploadBytes,
  getBytes,
} from 'firebase/storage';

test('an uploaded object is readable at its path', async () => {
  const app = initializeApp({ projectId: 'demo-todo-list', storageBucket: 'demo-todo-list.appspot.com' }, `p-${Date.now()}`);
  const storage = getStorage(app);
  connectStorageEmulator(storage, '127.0.0.1', 9199);

  const path = 'lists/list-1/item-1/photo.jpg';
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xdb]);
  await uploadBytes(ref(storage, path), bytes, { contentType: 'image/jpeg' });

  const read = new Uint8Array(await getBytes(ref(storage, path)));
  assert.deepEqual(read, bytes);

  await deleteApp(app);
});
```

- [ ] **Step 2: Run it and watch it pass**

Run: `npm run test:services`
Expected: 2 tests, 2 pass. This pins the round trip the service wraps.

- [ ] **Step 3: Write the service**

Create `src/app/core/photo.service.ts`:

```ts
import { Injectable, inject } from '@angular/core';
import { deleteObject, getBlob, ref, uploadString } from 'firebase/storage';
import { FIREBASE_STORAGE } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly storage = inject(FIREBASE_STORAGE);

  async upload(listId: string, itemId: string, dataUrl: string): Promise<string> {
    const path = `lists/${listId}/${itemId}/photo.jpg`;
    await uploadString(ref(this.storage, path), dataUrl, 'data_url');
    return path;
  }

  // Security rules are not evaluated on a getDownloadURL token URL, so the bytes
  // are fetched through the SDK and handed to the page as a blob URL.
  async objectUrl(photoPath: string): Promise<string> {
    const blob = await getBlob(ref(this.storage, photoPath));
    return URL.createObjectURL(blob);
  }

  remove(photoPath: string): Promise<void> {
    return deleteObject(ref(this.storage, photoPath));
  }
}
```

That comment stays. It records why the obvious call is the wrong one, which the code cannot say by itself.

- [ ] **Step 4: Export it**

Add to `src/app/core/index.ts`:

```ts
export * from './photo.service';
```

- [ ] **Step 5: Check the types**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: unchanged from task 7. `photo.service.ts` must contribute no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/core/photo.service.ts src/app/core/index.ts test/services/photo.service.test.ts
git commit -m "feat: store photos in Cloud Storage instead of the database"
```

---

### Task 9: ShareListService reduced to membership reads

**Files:**
- Rewrite: `src/app/core/share-list.service.ts`

**Interfaces:**
- Consumes: `FIRESTORE`, `AuthService`, `TodoList`, `User`.
- Produces:

```ts
sharedWithMe$(): Observable<User[]>
iShareWith$(): Observable<User[]>
leaveList(listId: string): Promise<void>
```

`SharePayload`, `parseSharePayload`, `addSharedWithMe`, `deleteSharedUser`, `unshareListWithMe`, `sharedListIds$`, `sharedUser$` and `uidsIShareWith$` are all deleted. The QR accept flow returns in the sharing plan.

- [ ] **Step 1: Rewrite the service**

`src/app/core/share-list.service.ts` becomes:

```ts
import { Injectable, inject } from '@angular/core';
import { arrayRemove, collection, deleteField, doc, query, updateDoc, where } from 'firebase/firestore';
import { collectionData, docData } from 'rxfire/firestore';
import { Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { TodoList, User } from '../models';
import { AuthService } from './auth.service';
import { FIRESTORE } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class ShareListService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  sharedWithMe$(): Observable<User[]> {
    return this.peers$((list, uid) => list.ownerUid !== uid, (list) => list.ownerUid);
  }

  iShareWith$(): Observable<User[]> {
    return this.peers$(
      (list, uid) => list.ownerUid === uid,
      () => '',
    ).pipe(map(() => []));
  }

  leaveList(listId: string): Promise<void> {
    const uid = this.auth.uid;
    if (!uid) {
      return Promise.reject(new Error('No signed-in user'));
    }
    return updateDoc(doc(this.db, 'lists', listId), {
      memberUids: arrayRemove(uid),
      [`joinedAt.${uid}`]: deleteField(),
    });
  }

  private peers$(
    keep: (list: TodoList, uid: string) => boolean,
    peerUid: (list: TodoList) => string,
  ): Observable<User[]> {
    const uid = this.auth.uid;
    if (!uid) {
      return of([]);
    }
    return (
      collectionData(
        query(collection(this.db, 'lists'), where('memberUids', 'array-contains', uid)),
        { idField: 'id' },
      ) as Observable<TodoList[]>
    ).pipe(
      map((lists) => [...new Set(lists.filter((l) => keep(l, uid)).map(peerUid))]),
      switchMap((uids) =>
        uids.length === 0 ? of([]) : combineLatest(uids.map((u) => this.profile$(u))),
      ),
      map((users) => users.filter((u): u is User => u !== null)),
    );
  }

  private profile$(uid: string): Observable<User | null> {
    return docData(doc(this.db, 'users', uid)) as Observable<User | null>;
  }
}
```

`iShareWith$()` returns an empty list in this plan and is wired properly in the sharing plan. Leaving it present keeps `share-my-notes.page.ts` compiling without a stub component.

- [ ] **Step 2: Check the types**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: FAIL only in the pages and templates now. Every file under `src/app/core` must be clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/core/share-list.service.ts
git commit -m "feat: derive sharing peers from list membership"
```

---

### Task 10: Wire the pages to the new services

**Files:**
- Modify: `src/app/pages/home/home.page.ts` and `.html`
- Modify: `src/app/pages/details/details.page.ts` and `.html`
- Modify: `src/app/pages/item-details/item-details.modal.ts` and `.html`
- Modify: `src/app/pages/share-my-notes/share-my-notes.page.ts`
- Modify: `src/app/pages/shared-with-me/shared-with-me.page.ts`
- Modify: `src/app/app.routes.ts`

**Interfaces:**
- Consumes: every signature from tasks 7, 8 and 9.
- Produces: no new exports.

- [ ] **Step 1: Simplify the routes**

A list id is globally unique now, so `ownerUid` leaves the paths. In `src/app/app.routes.ts` replace the two affected entries:

```ts
  {
    path: 'details/:listId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/details/details.page').then((m) => m.DetailsPage),
  },
```

and delete the `home/:ownerUid` route entirely. Browsing another person's lists is rebuilt in the sharing plan.

- [ ] **Step 2: Update HomePage**

In `home.page.ts`, drop `sharedOwnerUid`, `isShared`, `sharedUser`, `unshareList` and the `ShareListService` injection. The lists signal becomes:

```ts
  private readonly ownerUid = this.auth.uid ?? '';

  protected readonly lists = toSignal(this.todoListService.lists$(this.ownerUid));

  protected readonly title = 'My Notes';
```

`addList` calls `createList(this.ownerUid, data?.['name'] ?? '')`, `deleteList` calls `deleteList(todoList.id)`, `renameList` calls `renameList(todoList.id, ...)`, and `goToDetails` navigates to `['/details', todoList.id]`.

In `home.page.html`, remove the `@if` branches guarded by `isShared` and the Unshare button, and change the list summary block: `todoList.items` no longer exists, so delete the summary `ion-list` and the `value` pipe usage from this template.

- [ ] **Step 3: Update DetailsPage**

`details.page.ts` reads one route param:

```ts
  private readonly listId = inject(ActivatedRoute).snapshot.paramMap.get('listId') ?? '';

  protected readonly todoList = toSignal(this.todoListService.list$(this.listId));
  protected readonly items = toSignal(this.todoListService.items$(this.listId), {
    initialValue: [] as Item[],
  });
```

The template iterates `items()` directly instead of `todoList.items | value`, and the back button href is the constant `/home`.

For the photo, replace the `img [src]="item.image"` binding with a small resolver on the component:

```ts
  protected readonly photoUrls = signal<Record<string, string>>({});

  protected async showPhoto(item: Item): Promise<void> {
    if (!item.photoPath || this.photoUrls()[item.id]) {
      return;
    }
    const url = await this.photos.objectUrl(item.photoPath);
    this.photoUrls.update((urls) => ({ ...urls, [item.id]: url }));
  }

  ngOnDestroy(): void {
    Object.values(this.photoUrls()).forEach((url) => URL.revokeObjectURL(url));
  }
```

Call `showPhoto(item)` from an `@for` block effect or on card render, and bind `[src]="photoUrls()[item.id]"`.

- [ ] **Step 4: Update the item modal**

`item-details.modal.ts` takes `listId` instead of `ownerUid` plus `listId`, and its save path becomes:

```ts
  private async save(): Promise<void> {
    const draft = { ...this.draft(), date: Date.now() };
    const itemId = this.item?.id ?? (await this.todoListService.addItem(this.listId, draft));
    const dataUrl = this.pendingPhoto();
    if (dataUrl) {
      const photoPath = await this.photos.upload(this.listId, itemId, dataUrl);
      await this.todoListService.updateItem(this.listId, { ...draft, id: itemId, photoPath });
    } else if (this.item) {
      await this.todoListService.updateItem(this.listId, { ...draft, id: itemId });
    }
  }
```

The photo is uploaded after the item exists, because the object path contains the item id.

- [ ] **Step 5: Update the two sharing pages**

`share-my-notes.page.ts` calls `iShareWith$()` and `shared-with-me.page.ts` calls `sharedWithMe$()`, both of which now yield `User[]` directly rather than a list of observables. Remove the `AsyncPipe` usage in both templates and iterate the array. Delete the QR scan handler from `shared-with-me.page.ts` and the `parseSharePayload` import; leave the Scan button visible and have it toast `Sharing is being rebuilt`.

Delete `goToLists(user)` from `shared-with-me.page.ts` and the `(click)` binding on the row in its template. That handler navigated to `/home/:ownerUid`, which step 1 removes, so leaving it would send a tap through the wildcard route back to `/home`. The row stays inert until the sharing plan restores it.

- [ ] **Step 6: Build, lint and type check**

Run:

```bash
npx tsc -p tsconfig.app.json --noEmit && npx ng lint && npx ng build
```

Expected: all three clean. This is the first green build since task 2.

- [ ] **Step 7: Commit**

```bash
git add src/app
git commit -m "feat: wire the pages to Firestore and Cloud Storage"
```

---

### Task 11: Remove Realtime Database

**Files:**
- Modify: `package.json`
- Verify: the whole tree

**Interfaces:**
- Consumes: everything above.
- Produces: nothing.

- [ ] **Step 1: Prove nothing imports the database any more**

Run:

```bash
grep -rn "firebase/database\|rxfire/database\|databaseURL\|FIREBASE_DATABASE" src test || echo "clean"
```

Expected: `clean`. If `databaseURL` still appears in `src/environments/environment.ts`, delete that one key; the modular SDK does not need it once Realtime Database is unused.

- [ ] **Step 2: Run every gate**

Run:

```bash
npx tsc -p tsconfig.app.json --noEmit && npx ng lint && npx ng build && npm run test:rules && npm run test:services
```

Expected: all clean, 24 rules tests and 2 service tests passing.

- [ ] **Step 3: Verify in a browser**

Start the dev server and confirm the auth page renders with no console errors, and that every protected route redirects to `/auth` when signed out. Signed-in flows need real Google credentials and are verified by the repository owner, not in this task.

- [ ] **Step 4: Commit and open the pull request**

```bash
git add -A
git commit -m "refactor: drop the Realtime Database dependency"
```

The pull request body must record four things: that `deleteList` orphans its items and `deleteItem` orphans its photo object until the account lifecycle plan adds a cascade, that `PhotoService.remove` is therefore written but not yet called, that deploying the Storage rules needs the `roles/firebaserules.firestoreServiceAgent` grant, and that sharing shows an empty state until the sharing plan lands.

---

## Self-review

**Spec coverage.** Phase 1 of the spec is task 1. Phase 2 is tasks 2 through 11. The data model section maps to task 2, the Firestore rules block to tasks 3, 4 and 6, the Storage rules block to task 5, and the photo decisions to task 8. Phases 3 through 7 are deliberately absent and belong to later plans.

**Three gaps this plan does not close, all recorded in the final pull request body.** Deleting a list leaves its items behind, because Firestore does not cascade. Deleting an item leaves its photo object in Cloud Storage, for the same reason: `PhotoService.remove` exists but nothing calls it yet. Both cascades are Cloud Function work in the account lifecycle plan. And `iShareWith$()` returns an empty array until the sharing plan wires it.

**Type consistency.** `createList` returns `Promise<string>` in task 7 and is called for its return value in task 10. `upload` returns the path in task 8 and that path is written to `photoPath` in task 10, matching the `Item` shape in task 2. `objectUrl` returns a blob URL and task 10 revokes it. The service methods take `listId` alone after task 7, and no caller passes `ownerUid` to them.

---

## Implementation record

Executed 2026-09-21 to 2026-09-22. Tasks 1 and 2 ran as Claude subagents with Claude reviewers; from task 3 the controller implemented directly and ChatGPT, driven through the user's Chrome, reviewed at three checkpoints. Final state: 53 rules tests and 4 service contract tests passing, build, lint and types clean.

The implementation departs from the task text above in several places. Where they disagree, the code and the rulings below are authoritative.

### What changed from the plan

- **Schema.** `TodoList` gained `createdAt`, `Item` gained `listCreatedAt`, and `joinedAt` values are Timestamps. Items and photos are bound to their list's createdAt, which the rules force to equal `request.time`, so a recreated list id cannot inherit a deleted list's orphans.
- **Storage path.** `lists/{listId}/{epoch}/{itemId}/{uuid}.jpg`. The epoch is createdAt as `millis_nanos`, built by `epochOf` in `src/app/models/epoch.ts`, which the app and the tests share.
- **Services.** `items$` filters on `listCreatedAt`, because rules are not filters and an unfiltered query is rejected. `createList` and `lists$` derive the uid themselves. Items are written with `createItem` under a preallocated id and edited with `updateItem`, which uses `updateDoc` so an edit to a deleted item fails. `leaveList` removes the join time through a `FieldPath`.
- **Save and delete flows.** Photos upload to a fresh object before one Firestore write; a failed write removes the new object. Deleting removes the item before its photo.
- **Tests.** The plan's unauthenticated service tests were replaced by contract tests that replay each service's payloads as a signed in user under the real rules.
- **CI.** Runs both suites, with Temurin 21 for the emulators and Node 24 LTS for native TypeScript stripping.

### Rulings

Each is a decision taken without asking, with what it costs if wrong.

1. Every cumulative rules test total in the plan was one short, omitting the task 1 smoke test. Corrected before task 1. Cost if wrong: an implementer hunts a missing test.
2. Task 10 removes the `goToLists` handler along with the `home/:ownerUid` route it targeted. Cost if wrong: an inert row until the sharing plan.
3. `withTestEnv` clears Storage as well as Firestore, overriding the brief's verbatim helper. Cost if wrong: one redundant emulator call per test.
4. Wiring CI to the tests moved from task 1 to task 11, since it needs a Java step. Closed in task 11.
5. Rules test files run with `--test-concurrency=1`, because every file clears the one shared emulator. Cost if wrong: a few seconds of suite time.
6. The emulator starts under the `demo-todo-list` project, since cross service lookups use the emulator's project. Cost if wrong: none offline; `demo-` keeps it offline.
7. Items and photos are bound to an unforgeable list epoch. Cost if wrong: extra fields and a longer path.
8. Membership stays on the list document; `Map.diff` proves survivors unchanged, so no subcollection. The reviewer conceded.
9. No byte level image validation: only the owner uploads. The reviewer agreed.
10. Profile `get` stays open to signed in users for the sharing UI; `list` is denied to stop email harvesting.
11. Item update checks both the stored and the written epoch, after a verified hole in the first fix.
12. `epochOf` uses integer math: rules `seconds()` is the clock second, Firestore keeps microseconds, and the SDK `toMillis()` is a float. Cost if wrong: failed uploads, caught by the round trip test.
13. CI and Pages build on Node 24 LTS rather than rely on when Node 22 made type stripping the default.
14. Photos upload to a fresh object before the Firestore write, with compensation on failure. Cost if wrong: orphan objects on a failed compensation, see 16.
15. Parked: a transient photo load failure stays blank until the list emits again. Cost if wrong: an occasional blank photo.
16. Parked: `removeQuietly` swallows cleanup failures, leaving unobservable orphans. Cost if wrong: Storage objects accumulate until the cleanup job.
17. Parked: concurrent photo replacement can orphan an intermediate version. Cost if wrong: a rare extra orphaned image.

Rulings 15 to 17 share one remedy: a server side job, planned for the account lifecycle plan, that deletes any Storage object no item references. The same job closes the list deletion cascade.

### Before this can run against the real project

Nothing here is deployed. The project needs the Blaze plan, Firestore and Cloud Storage enabled, `firestore.rules` and `storage.rules` deployed, and the `roles/firebaserules.firestoreServiceAgent` grant the console offers when the Storage rules are first saved. Signed in flows are unverified until then.
