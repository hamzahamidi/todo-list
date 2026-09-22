import { Injectable, inject } from '@angular/core';
import {
  arrayRemove,
  collection,
  deleteField,
  doc,
  FieldPath,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { collectionData, docData } from 'rxfire/firestore';
import { Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { TodoList, User } from '../models';
import { AuthService } from './auth.service';
import { FIRESTORE } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class ShareListService {
  private readonly db = inject(FIRESTORE);
  private readonly auth = inject(AuthService);

  sharedWithMe$(): Observable<User[]> {
    const uid = this.auth.uid;
    if (!uid) {
      return of([]);
    }
    return this.myLists$(uid).pipe(
      map((lists) => [
        ...new Set(lists.filter((list) => list.ownerUid !== uid).map((list) => list.ownerUid)),
      ]),
      switchMap((ownerUids) => this.profiles$(ownerUids)),
    );
  }

  iShareWith$(): Observable<User[]> {
    return of([]);
  }

  leaveList(listId: string): Promise<void> {
    const uid = this.auth.uid;
    if (!uid) {
      return Promise.reject(new Error('No signed-in user'));
    }
    // A FieldPath keeps the uid one literal segment; a dotted string would split a
    // uid containing dots into nested fields and the rule would reject the write.
    return updateDoc(
      doc(this.db, 'lists', listId),
      'memberUids',
      arrayRemove(uid),
      new FieldPath('joinedAt', uid),
      deleteField(),
    );
  }

  private myLists$(uid: string): Observable<TodoList[]> {
    return collectionData(
      query(collection(this.db, 'lists'), where('memberUids', 'array-contains', uid)),
      { idField: 'id' },
    ) as Observable<TodoList[]>;
  }

  private profiles$(uids: string[]): Observable<User[]> {
    if (uids.length === 0) {
      return of([]);
    }
    return combineLatest(
      uids.map((uid) => docData(doc(this.db, 'users', uid)) as Observable<User | undefined>),
    ).pipe(map((users) => users.filter((user): user is User => user !== undefined)));
  }
}
