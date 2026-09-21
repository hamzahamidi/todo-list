export interface Item {
  id: string;
  name: string;
  state: boolean;
  description: string;
  date: number;
  photoPath?: string;
}

export interface TodoList {
  id: string;
  ownerUid: string;
  name: string;
  date: number;
  memberUids: string[];
  joinedAt: Record<string, number>;
}

export function newItem(): Omit<Item, 'id'> {
  return { name: '', state: false, description: '', date: Date.now() };
}
