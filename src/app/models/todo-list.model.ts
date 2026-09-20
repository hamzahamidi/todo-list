export interface Item {
  id: string;
  name: string;
  state: boolean;
  description: string;
  date: number;
  image?: string;
}

export interface TodoList {
  id: string;
  name: string;
  date: number;
  items?: Record<string, Item>;
  read?: boolean;
  write?: boolean;
}

export function newItem(): Omit<Item, 'id'> {
  return { name: '', state: false, description: '', date: Date.now() };
}
