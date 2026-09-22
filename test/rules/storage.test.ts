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
