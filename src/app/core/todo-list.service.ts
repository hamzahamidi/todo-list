import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { collectionData, docData } from 'rxfire/firestore';
import { Observable, map } from 'rxjs';
import { Item, TodoList } from '../models';
import { FIRESTORE } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class TodoListService {
  private readonly db = inject(FIRESTORE);

  lists$(uid: string): Observable<TodoList[]> {
    return collectionData(
      query(collection(this.db, 'lists'), where('memberUids', 'array-contains', uid)),
      { idField: 'id' },
    ) as Observable<TodoList[]>;
  }

  list$(listId: string): Observable<TodoList | null> {
    return docData(doc(this.db, 'lists', listId), { idField: 'id' }).pipe(
      map((list) => (list ? (list as TodoList) : null)),
    );
  }

  // The items rule reads listCreatedAt, and rules are not filters, so the query
  // must constrain it or Firestore rejects the whole query.
  items$(listId: string, listCreatedAt: Timestamp): Observable<Item[]> {
    return collectionData(
      query(
        collection(this.db, 'lists', listId, 'items'),
        where('listCreatedAt', '==', listCreatedAt),
      ),
      { idField: 'id' },
    ) as Observable<Item[]>;
  }

  async createList(ownerUid: string, name: string): Promise<string> {
    const created = await addDoc(collection(this.db, 'lists'), {
      ownerUid,
      name,
      date: Date.now(),
      createdAt: serverTimestamp(),
      memberUids: [ownerUid],
      joinedAt: { [ownerUid]: serverTimestamp() },
    });
    return created.id;
  }

  renameList(listId: string, name: string): Promise<void> {
    return updateDoc(doc(this.db, 'lists', listId), { name });
  }

  deleteList(listId: string): Promise<void> {
    return deleteDoc(doc(this.db, 'lists', listId));
  }

  async addItem(
    listId: string,
    listCreatedAt: Timestamp,
    item: Omit<Item, 'id' | 'listCreatedAt'>,
  ): Promise<string> {
    const created = await addDoc(collection(this.db, 'lists', listId, 'items'), {
      ...item,
      listCreatedAt,
    });
    return created.id;
  }

  updateItem(listId: string, item: Item): Promise<void> {
    const { id, ...rest } = item;
    return setDoc(doc(this.db, 'lists', listId, 'items', id), rest);
  }

  deleteItem(listId: string, itemId: string): Promise<void> {
    return deleteDoc(doc(this.db, 'lists', listId, 'items', itemId));
  }
}
