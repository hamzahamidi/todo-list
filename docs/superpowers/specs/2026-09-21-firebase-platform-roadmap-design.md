# Platform roadmap: Firestore, Cloud Storage, and a three-platform release

Date: 2026-09-21
Status: design, approved in outline

## Why this exists

The app was migrated from Ionic 3 to Ionic 9 and now builds, deploys and runs. It is not
ready for the people who will find it. Three things stand between the current state and a
release: photos are stored in a way that does not scale, the sharing model duplicates data
that then goes stale, and the security rules that hold the whole thing together exist only
in the Firebase console.

The target is a public release on web, Android and iOS, with real users whose data matters.

## Scope

In scope: the data model, photo storage, security rules and their tests, sign-in providers,
account deletion, App Check, and the first native builds.

Out of scope: preserving any data that exists today. It is disposable, so nothing here
needs a migration path. Also out of scope: redesigning the UI, and the searchbar, which has
never filtered anything and stays as it is.

## What is true today

| | Current |
|---|---|
| Lists | `/users/{uid}/todo-lists/{listId}` in Realtime Database |
| Items | `/users/{uid}/todo-lists/{listId}/items/{itemId}` |
| Photos | base64 data URL in `item.image`, stored inline with the item |
| Shares | the list is copied into `/users/{sharee}/shared-with-me/...` and `/users/{owner}/i-share-with/...` |
| Rules | not in the repository; console only |
| Providers | Google only |
| Platforms | web (deployed), Android configured but never compiled, iOS never existed |
| Plan | Spark |

Two defects follow directly from that table.

**Photos do not scale.** A base64 data URL is about 33% larger than the bytes it encodes, it
is stored inside the item, and the item is read whenever its list is read. Every list read
therefore drags every photo in that list across the wire.

**Shared lists go stale.** Sharing writes a copy of the list into the sharee's subtree. When
the owner edits the list afterwards, the copy is not updated. This is not a bug in the
migration; it is inherent to the shape, because Realtime Database rules cannot read another
node to answer "is this user a member of that list".

## Decisions already taken

**The Firebase web API key stays public.** It is a project identifier, not a credential, and
it ships in the JavaScript bundle however it is stored. Putting it in GitHub Secrets would
add build friction and change nothing an attacker can do. Verified on 2026-09-21: an
unauthenticated read and an unauthenticated write against the Realtime Database both return
`401 Permission denied`, so the rules are already the control. The gap is that those rules
are not in version control and have no tests.

**Photos move to Cloud Storage, not Firestore.** A Firestore document is capped at 1 MiB,
which a photo will exceed. Cloud Storage is the service for bytes; Firestore holds a
reference.

**The database moves to Firestore.** Firestore rules can read other documents, so membership
can be expressed directly on the list and the duplication disappears along with the
staleness it causes.

**Providers are Google, Apple and Facebook.** Apple is not optional. App Store Review
Guideline 4.8 requires an app that uses a third-party service to set up the primary account
to also offer a login that limits collection to name and email, allows the email to be kept
private, and does not collect interactions for advertising without consent. None of the five
exemptions apply to this app. Adding Facebook does not satisfy 4.8, because Facebook is
another third-party service rather than an equivalent option.

**In-app account deletion ships with the providers.** Guideline 5.1.1(v) requires it of any
app that supports account creation, with no exemption that fits.

**The project moves to the Blaze plan.** Cloud Storage and Cloud Functions both need it. The
expected volume sits inside the free tier, but a payment method is required.

## Non-goals

- Migrating existing data.
- Offline-first behaviour beyond what the Firestore SDK provides by default.
- Real-time collaborative editing of a single item.
- Web push or any notification work.

## Findings that shaped the design

These were verified against official documentation on 2026-09-21, each by one researcher and
one independent checker whose job was to refute it. Three reversed an assumption.

**Cloud Storage rules can read Firestore.** `firestore.get()` and `firestore.exists()` have
been available in `storage.rules` since 2022-09-22. Membership therefore does not need to be
duplicated into the storage path. Limits that matter: at most two Firestore documents per
rules evaluation, the default database only, each call billed as a Firestore read, and
roughly 75 ms to 200 ms of added latency. The feature needs the IAM role
`roles/firebaserules.firestoreServiceAgent`, which the console offers to grant on first save.
The official example on that page prints `request.auth.id`, which does not exist and denies
every request. The field is `request.auth.uid`.

**A download URL bypasses rules permanently.** Storage rules are evaluated on requests that
go through the Firebase Storage API. They are not evaluated on an `<img src>` pointing at a
`getDownloadURL()` token URL. That URL is a bearer capability: it never expires, it works for
anyone who has it, and revoking it means rotating the token for every holder at once. Photos
must therefore be fetched with `getBlob()` and shown through `URL.createObjectURL()`.

**A map field cannot be queried for key existence.** Firestore has no map-contains-key
operator; the full set is `<`, `<=`, `==`, `>=`, `>`, `!=`, `array-contains`,
`array-contains-any`, `in`, `not-in`. Because security rules are not filters, the query for
"lists I can see" has to be expressible on its own, so membership needs a parallel array
field queried with `array-contains`. This is why the schema carries `memberUids` as an array
rather than keying membership off a map, and why `joinedAt`, which is a map, is never queried.

**Firebase Extensions is deprecated and shuts down on 2027-03-31.** The Delete User Data
extension is still installable but is not a foundation for new work, so account deletion is
an ordinary Cloud Function. The Resize Images extension does not apply: photos are captured
at 300 px and are not resized server side.

**The Capacitor auth plugin covers both new providers.** `@capacitor-firebase/authentication`
8.5.2, already installed, supports `apple.com` and `facebook.com` with the `skipNativeAuth`
pattern this app already uses for Google. Three caveats land in the design: Apple on Android
creates a native Firebase session that `skipNativeAuth` does not suppress, Facebook on iOS
needs either an App Tracking Transparency prompt or Limited Login, and the web build is
served from GitHub Pages, so `signInWithRedirect` is not viable and sign-in stays on
`signInWithPopup`.

## Data model

One list document holds its own membership. There is exactly one copy of a list.

```
lists/{listId}
  ownerUid   string
  name       string
  date       number
  memberUids string[]              // drives the query; owner included
  joinedAt   map<uid, timestamp>   // when each member joined; owner set at creation

lists/{listId}/items/{itemId}
  name        string
  state       boolean
  description string
  date        number
  photoPath   string | null        // a Storage path, never a download URL
```

There is no role field. An invite grants read, and only the owner writes, so membership and
write authority are already fully described by `memberUids` and `ownerUid`. `joinedAt` exists
for one reason: when an owner deletes their account the list transfers to the member who
joined earliest, and nothing else records that order. `memberUids` and `joinedAt` are written
together in a single update, and a rule enforces that they agree.

The query for the lists a user can see:

```ts
query(collection(db, 'lists'), where('memberUids', 'array-contains', uid))
```

Storage objects live at `lists/{listId}/{itemId}/{filename}`, so the rule can read `listId`
straight out of the path and spend its single Firestore lookup on the list document.

## Security rules

Both rule sets are files in the repository, not console state. The shape, with the parts
that are easy to get wrong called out:

```
// firestore.rules
match /lists/{listId} {
  allow read:   if request.auth.uid in resource.data.memberUids;
  allow create: if request.auth.uid == request.resource.data.ownerUid
                && request.resource.data.memberUids == [request.auth.uid];
  allow delete: if request.auth.uid == resource.data.ownerUid;

  // The owner edits the list. A member may only remove themselves.
  allow update: if (request.auth.uid == resource.data.ownerUid
                    && request.resource.data.ownerUid == resource.data.ownerUid)
                || isSelfRemoval();

  match /items/{itemId} {
    allow read:  if request.auth.uid in
      get(/databases/$(database)/documents/lists/$(listId)).data.memberUids;
    allow write: if request.auth.uid ==
      get(/databases/$(database)/documents/lists/$(listId)).data.ownerUid;
  }
}
```

The owner drives every edit, which keeps the update rule short. It still pins `ownerUid`,
because without that an owner could hand the list to someone who never agreed to hold it.

Membership moves in two directions and they are not symmetric. Joining goes through a
callable Cloud Function, because a client cannot be trusted to decide that its own invite
token was valid, unexpired and unused. Leaving is a client write, allowed by `isSelfRemoval()`:
a diff that removes the caller's own uid from `memberUids` and `joinedAt` and changes nothing
else. Writing that helper precisely, so it cannot be used to remove somebody else, is the
sharpest rules test in phase 3.

```
// storage.rules
match /b/{bucket}/o/lists/{listId}/{allPaths=**} {
  allow read:  if request.auth != null
    && request.auth.uid in
       firestore.get(/databases/(default)/documents/lists/$(listId)).data.memberUids;
  allow write: if request.auth != null
    && request.auth.uid ==
       firestore.get(/databases/(default)/documents/lists/$(listId)).data.ownerUid
    && request.resource.size < 10 * 1024 * 1024
    && request.resource.contentType.matches('image/.*');
}
```

Rules are tested against the emulator suite. The tests are the deliverable, not the rules
text: each one asserts both that a member can do a thing and that a non-member cannot.

## Phases

Each phase ends in a merged pull request with the build, lint and rules tests green.

**Phase 1, foundation.** `firebase.json`, the emulator suite, and a rules test harness with
`@firebase/rules-unit-testing`. No behaviour change. Everything after this is testable.

**Phase 2, Firestore and Cloud Storage.** The schema above, both rule sets with tests, the
three services rewritten, and photos moved to Storage with `photoPath` on the item. Photos
are read with `getBlob()`. Realtime Database usage is deleted in the same pass. This phase
fixes the upload problem and the stale share at once, because both were consequences of the
old shape.

**Phase 3, sharing.** Membership replaces the duplicated subtrees. The QR code carries a
list id and an invite token rather than a copy of the list. The web gets an invite link,
since QR scanning needs a camera the desktop web build will not reliably have. An invite
grants read only. Accepting one calls a Cloud Function that checks the token and adds the
caller to `memberUids` and `joinedAt` in one write; leaving is a direct client write covered
by `isSelfRemoval()`.

**Phase 4, account lifecycle.** In-app account deletion, required by Apple guideline
5.1.1(v). A Cloud Function removes the user from every list they joined, and for each list
they own decides between two cases: a list with other members transfers to the member with
the earliest `joinedAt`, and a list with no other members is deleted along with its items and
Storage objects.
Deleting an Auth user requires a recent sign-in, so the flow reauthenticates first. Sign in
with Apple also requires revoking the Apple token, which the Firebase JS SDK exposes
as `revokeAccessToken`.

**Phase 5, providers.** Sign in with Apple, then Facebook. Apple needs an Apple Developer
account, a Services ID, a key, and return URLs. Facebook needs a Meta app, App Review for
public login, a hosted privacy policy, and a data deletion callback endpoint, which is a
second Cloud Function. The client keeps the `skipNativeAuth` pattern already in
`AuthService`.

**Phase 6, App Check.** `ReCaptchaEnterpriseProvider` on web, `PlayIntegrityAppCheckProviderFactory`
on Android, `AppAttestProvider` on iOS, with the debug providers wired for local development
and CI. Enforcement is switched on per product after the token metrics show real traffic
passing. App Attest needs Xcode 12.5 or newer and the production entitlement, and rejects
sandbox tokens.

**Phase 7, native and stores.** The first Android build and the first iOS build this project
has ever had. Privacy policy, store listings, signing, and two review queues.

## Testing

| Layer | How |
|---|---|
| Security rules | `@firebase/rules-unit-testing` against the emulator, positive and negative per rule |
| Services | against the Firestore emulator, not mocks |
| Account deletion | emulator: seed a user with owned and joined lists, delete, assert nothing remains |
| Photos | emulator: upload as a member, read as a member, read as a non-member and expect denial |
| Web | the existing build, lint and idiom gates, plus a browser pass on the deployed artifact |
| Native | manual on a device per platform; no automated native tests are planned |

## Risks

**App Check locks out a legitimate client if enforced too early.** Turn enforcement on per
product only after metrics show verified traffic. Keep the debug provider working in CI.

**Cross-service rules add a Firestore read and up to 200 ms to every image request.** For a
list of photos this is per object. If it proves slow, the fallback is a Cloud Function
minting V4 signed URLs, which caps at seven days and cannot be revoked early.

**Facebook App Review can reject or stall.** It is the only phase with an external gate not
under our control. Nothing else depends on it, so it ships last within phase 5.

**Two fields describe membership.** `memberUids` and `joinedAt` can drift, and a list whose
`joinedAt` is missing an entry has no defined transfer target. The join function writes both
in one update, `isSelfRemoval()` requires both to change together, and the tests assert it.

## Resolved on 2026-09-21

**An owner who deletes their account hands the list to its oldest member.** The member with
the earliest `joinedAt` becomes the new `ownerUid`. A list with no other members is deleted.
This is why `joinedAt` exists at all.

**An invite grants read.** Only the owner writes. That removed the role field from the
schema, shortened the update rule, and made the Storage write rule owner only.

**No thumbnails.** `@capacitor/camera` is already configured to capture at 300 px, so the
stored object is small enough to serve directly. No resize function, and no dependency on
the Resize Images extension that is going away in 2027.

## Deliberately deferred

- Changing a member's role after the fact. There are no roles to change.
- Write access for members. It would reintroduce the role field and widen every write rule.
- Offline conflict handling beyond Firestore's own last write wins.
