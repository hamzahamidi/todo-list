import { test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  arrayRemove,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { withTestEnv } from '../helpers/emulator.ts';

const OWNER = 'owner-uid';
const MEMBER = 'member-uid';
const STRANGER = 'stranger-uid';
const T0 = Timestamp.fromMillis(1000);
const T1 = Timestamp.fromMillis(2000);

async function seed(env: RulesTestEnvironment): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'lists/list-1'), {
      ownerUid: OWNER,
      name: 'Groceries',
      date: 1000,
      createdAt: T0,
      memberUids: [OWNER, MEMBER],
      joinedAt: { [OWNER]: T0, [MEMBER]: T1 },
    });
  });
}

function newList(ownerUid: string, memberUids: string[]) {
  const joinedAt: Record<string, unknown> = {};
  memberUids.forEach((uid) => (joinedAt[uid] = serverTimestamp()));
  return {
    ownerUid,
    name: 'Groceries',
    date: 1000,
    createdAt: serverTimestamp(),
    memberUids,
    joinedAt,
  };
}

function leave(uid: string) {
  return { memberUids: arrayRemove(uid), [`joinedAt.${uid}`]: deleteField() };
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

test('the owner cannot add a member directly', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(OWNER).firestore();
    await assertFails(
      updateDoc(doc(db, 'lists/list-1'), {
        memberUids: [OWNER, MEMBER, STRANGER],
        [`joinedAt.${STRANGER}`]: serverTimestamp(),
      }),
    );
  });
});

test('the owner cannot rewrite createdAt', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(OWNER).firestore();
    await assertFails(updateDoc(doc(db, 'lists/list-1'), { createdAt: T1 }));
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
        [`joinedAt.${STRANGER}`]: serverTimestamp(),
      }),
    );
  });
});

test('a member removes themselves', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertSucceeds(updateDoc(doc(db, 'lists/list-1'), leave(MEMBER)));
  });
});

test('a member cannot remove somebody else', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertFails(updateDoc(doc(db, 'lists/list-1'), leave(OWNER)));
  });
});

test('the owner cannot use self removal to leave', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(OWNER).firestore();
    await assertFails(updateDoc(doc(db, 'lists/list-1'), leave(OWNER)));
  });
});

test('leaving cannot also change another field', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertFails(
      updateDoc(doc(db, 'lists/list-1'), { ...leave(MEMBER), date: 9999 }),
    );
  });
});

test('leaving cannot add a new field', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertFails(
      updateDoc(doc(db, 'lists/list-1'), { ...leave(MEMBER), admin: true }),
    );
  });
});

test('leaving cannot rewrite another member join time', async () => {
  await withTestEnv(async (env) => {
    await seed(env);
    const db = env.authenticatedContext(MEMBER).firestore();
    await assertFails(
      updateDoc(doc(db, 'lists/list-1'), {
        ...leave(MEMBER),
        [`joinedAt.${OWNER}`]: Timestamp.fromMillis(1),
      }),
    );
  });
});

test('creating a list with somebody else as owner fails', async () => {
  await withTestEnv(async (env) => {
    const db = env.authenticatedContext(OWNER).firestore();
    await assertFails(setDoc(doc(db, 'lists/list-2'), newList(STRANGER, [STRANGER])));
  });
});

test('creating a list pre-loaded with another member fails', async () => {
  await withTestEnv(async (env) => {
    const db = env.authenticatedContext(OWNER).firestore();
    await assertFails(setDoc(doc(db, 'lists/list-3'), newList(OWNER, [OWNER, STRANGER])));
  });
});

test('creating a list with a forged join time fails', async () => {
  await withTestEnv(async (env) => {
    const db = env.authenticatedContext(OWNER).firestore();
    await assertFails(
      setDoc(doc(db, 'lists/list-5'), { ...newList(OWNER, [OWNER]), joinedAt: { [OWNER]: T0 } }),
    );
  });
});

test('creating a list with a forged createdAt fails', async () => {
  await withTestEnv(async (env) => {
    const db = env.authenticatedContext(OWNER).firestore();
    await assertFails(
      setDoc(doc(db, 'lists/list-6'), { ...newList(OWNER, [OWNER]), createdAt: T0 }),
    );
  });
});

test('creating a list without a name fails', async () => {
  await withTestEnv(async (env) => {
    const db = env.authenticatedContext(OWNER).firestore();
    const { name: _omitted, ...withoutName } = newList(OWNER, [OWNER]);
    await assertFails(setDoc(doc(db, 'lists/list-7'), withoutName));
  });
});

test('creating a list with an unexpected field fails', async () => {
  await withTestEnv(async (env) => {
    const db = env.authenticatedContext(OWNER).firestore();
    await assertFails(
      setDoc(doc(db, 'lists/list-8'), { ...newList(OWNER, [OWNER]), admin: true }),
    );
  });
});

test('the owner creates a list with only themselves', async () => {
  await withTestEnv(async (env) => {
    const db = env.authenticatedContext(OWNER).firestore();
    await assertSucceeds(setDoc(doc(db, 'lists/list-4'), newList(OWNER, [OWNER])));
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

test('a signed in user reads one profile but cannot list them all', async () => {
  await withTestEnv(async (env) => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/member-uid'), { uid: MEMBER, email: 'x@y.z' });
    });
    const db = env.authenticatedContext(STRANGER).firestore();
    await assertSucceeds(getDoc(doc(db, 'users/member-uid')));
    await assertFails(getDocs(collection(db, 'users')));
  });
});
