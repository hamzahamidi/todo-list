import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { withTestEnv } from '../helpers/emulator.ts';

const OWNER = 'owner-uid';

test('the TodoListService payloads and queries are allowed end to end', async () => {
  await withTestEnv(async (env) => {
    const db = env.authenticatedContext(OWNER).firestore();

    const created = await addDoc(collection(db, 'lists'), {
      ownerUid: OWNER,
      name: 'Groceries',
      date: Date.now(),
      createdAt: serverTimestamp(),
      memberUids: [OWNER],
      joinedAt: { [OWNER]: serverTimestamp() },
    });

    const mine = await getDocs(
      query(collection(db, 'lists'), where('memberUids', 'array-contains', OWNER)),
    );
    assert.equal(mine.size, 1);

    const list = await getDoc(doc(db, 'lists', created.id));
    const createdAt = list.get('createdAt');
    assert.ok(createdAt instanceof Timestamp);

    const item = await addDoc(collection(db, 'lists', created.id, 'items'), {
      name: 'Milk',
      state: false,
      description: '',
      date: Date.now(),
      listCreatedAt: createdAt,
    });

    const items = await getDocs(
      query(
        collection(db, 'lists', created.id, 'items'),
        where('listCreatedAt', '==', createdAt),
      ),
    );
    assert.equal(items.size, 1);

    await updateDoc(doc(db, 'lists', created.id), { name: 'Fruit' });
    await setDoc(doc(db, 'lists', created.id, 'items', item.id), {
      name: 'Oat milk',
      state: true,
      description: '',
      date: Date.now(),
      listCreatedAt: createdAt,
    });
    await deleteDoc(doc(db, 'lists', created.id, 'items', item.id));
    await deleteDoc(doc(db, 'lists', created.id));
  });
});
