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

