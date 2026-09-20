import { Injectable, inject } from '@angular/core';
import { push, ref, remove, set, update } from 'firebase/database';
import { listVal, objectVal } from 'rxfire/database';
import { Observable, combineLatest, map, of } from 'rxjs';
import { Item, TodoList } from '../models';
import { FIREBASE_DATABASE } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class TodoListService {
  private readonly db = inject(FIREBASE_DATABASE);

  lists$(ownerUid: string): Observable<TodoList[]> {
    return listVal<TodoList>(ref(this.db, listsPath(ownerUid)));
  }

  list$(ownerUid: string, listId: string): Observable<TodoList | null> {
    return objectVal<TodoList>(ref(this.db, `${listsPath(ownerUid)}/${listId}`));
  }

  listsByIds$(ownerUid: string, listIds: string[]): Observable<TodoList[]> {
    if (listIds.length === 0) {
      return of([]);
    }
    return combineLatest(listIds.map((id) => this.list$(ownerUid, id))).pipe(
      // A list can be unshared while its id is still in the shared index.
      map((lists) => lists.filter((list): list is TodoList => list !== null)),
    );
  }

  async addList(ownerUid: string, name: string): Promise<void> {
    const listRef = push(ref(this.db, listsPath(ownerUid)));
    await set(listRef, { id: listRef.key, name, date: Date.now() });
  }

  deleteList(ownerUid: string, listId: string): Promise<void> {
    return remove(ref(this.db, `${listsPath(ownerUid)}/${listId}`));
  }

  renameList(ownerUid: string, listId: string, name: string): Promise<void> {
    return update(ref(this.db, `${listsPath(ownerUid)}/${listId}`), { name });
  }

  async addItem(
    ownerUid: string,
    listId: string,
    item: Omit<Item, 'id'>,
  ): Promise<void> {
    const itemRef = push(ref(this.db, itemsPath(ownerUid, listId)));
    await set(itemRef, { ...item, id: itemRef.key });
  }

  updateItem(ownerUid: string, listId: string, item: Item): Promise<void> {
    return set(ref(this.db, `${itemsPath(ownerUid, listId)}/${item.id}`), item);
  }

  deleteItem(ownerUid: string, listId: string, itemId: string): Promise<void> {
    return remove(ref(this.db, `${itemsPath(ownerUid, listId)}/${itemId}`));
  }
}

function listsPath(uid: string): string {
  return `/users/${uid}/todo-lists`;
}

function itemsPath(uid: string, listId: string): string {
  return `/users/${uid}/todo-lists/${listId}/items`;
}
