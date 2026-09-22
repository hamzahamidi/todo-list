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
import { Observable, map, of } from 'rxjs';
import { Item, ItemChanges, TodoList } from '../models';
import { AuthService } from './auth.service';
import { FIRESTORE } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class TodoListService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  lists$(): Observable<TodoList[]> {
    const uid = this.auth.uid;
    if (!uid) {
      return of([]);
    }
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

  // Rules are not filters: the items rule reads listCreatedAt, so the query must too.
  items$(listId: string, listCreatedAt: Timestamp): Observable<Item[]> {
    return collectionData(
      query(
        collection(this.db, 'lists', listId, 'items'),
        where('listCreatedAt', '==', listCreatedAt),
      ),
      { idField: 'id' },
    ) as Observable<Item[]>;
  }

  async createList(name: string): Promise<string> {
    const uid = this.auth.uid;
    if (!uid) {
      throw new Error('No signed-in user');
    }
    const created = await addDoc(collection(this.db, 'lists'), {
      ownerUid: uid,
      name,
      date: Date.now(),
      createdAt: serverTimestamp(),
      memberUids: [uid],
      joinedAt: { [uid]: serverTimestamp() },
    });
    return created.id;
  }

  renameList(listId: string, name: string): Promise<void> {
    return updateDoc(doc(this.db, 'lists', listId), { name });
  }

  deleteList(listId: string): Promise<void> {
    return deleteDoc(doc(this.db, 'lists', listId));
  }

  newItemId(listId: string): string {
    return doc(collection(this.db, 'lists', listId, 'items')).id;
  }

  createItem(listId: string, itemId: string, item: Omit<Item, 'id'>): Promise<void> {
    return setDoc(doc(this.db, 'lists', listId, 'items', itemId), item);
  }

  // updateDoc, not setDoc: an edit to an item deleted elsewhere must fail.
  updateItem(listId: string, itemId: string, changes: ItemChanges): Promise<void> {
    return updateDoc(doc(this.db, 'lists', listId, 'items', itemId), { ...changes });
  }

  deleteItem(listId: string, itemId: string): Promise<void> {
    return deleteDoc(doc(this.db, 'lists', listId, 'items', itemId));
  }
}
