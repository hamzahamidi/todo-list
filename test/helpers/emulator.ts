import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

export async function withTestEnv(
  fn: (env: RulesTestEnvironment) => Promise<void>,
): Promise<void> {
  const env = await initializeTestEnvironment({
    projectId: 'demo-todo-list',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
    storage: {
      rules: readFileSync('storage.rules', 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  });
  try {
    await env.clearFirestore();
    await fn(env);
  } finally {
    await env.cleanup();
  }
}
