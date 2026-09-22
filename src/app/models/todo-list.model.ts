import type { Timestamp } from 'firebase/firestore';

export interface Item {
  id: string;
  name: string;
  state: boolean;
  description: string;
  date: number;
  listCreatedAt: Timestamp;
  photoPath?: string;
}

export interface TodoList {
  id: string;
  ownerUid: string;
  name: string;
  date: number;
  createdAt: Timestamp;
  memberUids: string[];
  joinedAt: Record<string, Timestamp>;
}

export function newItem(): Omit<Item, 'id' | 'listCreatedAt'> {
  return { name: '', state: false, description: '', date: Date.now() };
}
