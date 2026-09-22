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
