import { test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { withTestEnv } from '../helpers/emulator.ts';

const OWNER = 'owner-uid';
const MEMBER = 'member-uid';
const STRANGER = 'stranger-uid';
const T0 = Timestamp.fromMillis(1000);
const T1 = Timestamp.fromMillis(2000);

const ITEM = {
  name: 'Milk',
  state: false,
  description: '',
  date: 1000,
  listCreatedAt: T0,
};

async function seed(env: RulesTestEnvironment): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'lists/list-1'), {
      ownerUid: OWNER,
      name: 'Groceries',
      date: 1000,
      createdAt: T0,
      memberUids: [OWNER, MEMBER],
      joinedAt: { [OWNER]: T0, [MEMBER]: T1 },
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

test('a member queries items filtered to the current list incarnation', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertSucceeds(
      getDocs(query(collection(db, 'lists/list-1/items'), where('listCreatedAt', '==', T0))),
    );
  });
});

test('an unfiltered items query is rejected, because rules are not filters', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertFails(getDocs(collection(db, 'lists/list-1/items')));
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

test('an item bound to another list incarnation cannot be written', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(OWNER).firestore();
    await assertFails(
      setDoc(doc(db, 'lists/list-1/items/item-5'), { ...ITEM, listCreatedAt: T1 }),
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

test('the owner deletes an item', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(OWNER).firestore();
    await assertSucceeds(deleteDoc(doc(db, 'lists/list-1/items/item-1')));
  });
});

test('an item under a missing list is denied', async () => {
  await withTestEnv(async (env) => {
    const db = env.authenticatedContext(OWNER).firestore();
    await assertFails(getDoc(doc(db, 'lists/nope/items/item-1')));
  });
});

test('recreating a deleted list id does not expose its orphaned items', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const owner = env.authenticatedContext(OWNER).firestore();
    await assertSucceeds(deleteDoc(doc(owner, 'lists/list-1')));

    const stranger = env.authenticatedContext(STRANGER).firestore();
    await assertSucceeds(
      setDoc(doc(stranger, 'lists/list-1'), {
        ownerUid: STRANGER,
        name: 'mine now',
        date: 3000,
        createdAt: serverTimestamp(),
        memberUids: [STRANGER],
        joinedAt: { [STRANGER]: serverTimestamp() },
      }),
    );
    await assertFails(getDoc(doc(stranger, 'lists/list-1/items/item-1')));
  });
});
