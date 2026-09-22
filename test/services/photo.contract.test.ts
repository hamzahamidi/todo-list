import { test } from 'node:test';
import assert from 'node:assert/strict';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { deleteObject, getBytes, ref, uploadString } from 'firebase/storage';
import { epochOf } from '../../src/app/models/epoch.ts';
import { withTestEnv } from '../helpers/emulator.ts';

const OWNER = 'owner-uid';
const DATA_URL = 'data:image/jpeg;base64,/9j/2wAB';

test('the PhotoService versioned path, upload, read and delete are allowed end to end', async () => {
  await withTestEnv(async (env) => {
    const db = env.authenticatedContext(OWNER).firestore();
    await setDoc(doc(db, 'lists/L'), {
      ownerUid: OWNER,
      name: 'n',
      date: 1,
      createdAt: serverTimestamp(),
      memberUids: [OWNER],
      joinedAt: { [OWNER]: serverTimestamp() },
    });
    const createdAt = (await getDoc(doc(db, 'lists/L'))).get('createdAt');

    const storage = env.authenticatedContext(OWNER).storage();
    const first = `lists/L/${epochOf(createdAt)}/item-1/${crypto.randomUUID()}.jpg`;
    const second = `lists/L/${epochOf(createdAt)}/item-1/${crypto.randomUUID()}.jpg`;
    await uploadString(ref(storage, first), DATA_URL, 'data_url');
    await uploadString(ref(storage, second), DATA_URL, 'data_url');

    const bytes = new Uint8Array(await getBytes(ref(storage, second)));
    assert.deepEqual([...bytes.slice(0, 3)], [0xff, 0xd8, 0xff]);
    assert.notEqual(first, second);

    await deleteObject(ref(storage, first));
    await deleteObject(ref(storage, second));
  });
});
