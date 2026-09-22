import { test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage';
import { withTestEnv } from '../helpers/emulator.ts';

const OWNER = 'owner-uid';
const MEMBER = 'member-uid';
const STRANGER = 'stranger-uid';
const T0 = Timestamp.fromMillis(1000);
const EPOCH = String(T0.toMillis());
const PATH = `lists/list-1/${EPOCH}/item-1/photo.jpg`;
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x01]);
const META = { contentType: 'image/jpeg' };

async function seed(env: RulesTestEnvironment): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'lists/list-1'), {
      ownerUid: OWNER,
      name: 'Groceries',
      date: 1000,
      createdAt: T0,
      memberUids: [OWNER, MEMBER],
      joinedAt: { [OWNER]: T0, [MEMBER]: Timestamp.fromMillis(2000) },
    });
    await uploadBytes(ref(ctx.storage(), PATH), JPEG, META);
  });
}

test('the owner uploads a photo', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const storage = env.authenticatedContext(OWNER).storage();
    await assertSucceeds(
      uploadBytes(ref(storage, `lists/list-1/${EPOCH}/item-2/photo.jpg`), JPEG, META),
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
      uploadBytes(ref(storage, `lists/list-1/${EPOCH}/item-9/photo.jpg`), JPEG, META),
    );
  });
});

test('a non-image upload is rejected', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const storage = env.authenticatedContext(OWNER).storage();
    await assertFails(
      uploadBytes(ref(storage, `lists/list-1/${EPOCH}/item-4/note.txt`), JPEG, {
        contentType: 'text/plain',
      }),
    );
  });
});

test('an upload under a stale epoch is rejected', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const storage = env.authenticatedContext(OWNER).storage();
    await assertFails(
      uploadBytes(ref(storage, 'lists/list-1/999/item-5/photo.jpg'), JPEG, META),
    );
  });
});

test('the owner deletes a photo', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const storage = env.authenticatedContext(OWNER).storage();
    await assertSucceeds(deleteObject(ref(storage, PATH)));
  });
});

test('a member cannot delete a photo', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const storage = env.authenticatedContext(MEMBER).storage();
    await assertFails(deleteObject(ref(storage, PATH)));
  });
});

test('recreating a deleted list id does not expose its orphaned photos', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const owner = env.authenticatedContext(OWNER).firestore();
    await assertSucceeds(deleteDoc(doc(owner, 'lists/list-1')));

    const strangerDb = env.authenticatedContext(STRANGER).firestore();
    await assertSucceeds(
      setDoc(doc(strangerDb, 'lists/list-1'), {
        ownerUid: STRANGER,
        name: 'mine now',
        date: 3000,
        createdAt: serverTimestamp(),
        memberUids: [STRANGER],
        joinedAt: { [STRANGER]: serverTimestamp() },
      }),
    );
    const storage = env.authenticatedContext(STRANGER).storage();
    await assertFails(getBytes(ref(storage, PATH)));
  });
});
