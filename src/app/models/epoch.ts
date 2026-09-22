import type { Timestamp } from 'firebase/firestore';

// Must match isCurrentEpoch() in storage.rules. The SDK's toMillis() returns a
// float, so the integer millisecond part is rebuilt from seconds and nanoseconds.
export function epochOf(createdAt: Timestamp): string {
  const millis = createdAt.seconds * 1000 + Math.floor(createdAt.nanoseconds / 1_000_000);
  return `${millis}_${createdAt.nanoseconds}`;
}
