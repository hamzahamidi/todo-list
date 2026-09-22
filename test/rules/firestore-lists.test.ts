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
