import { Injectable, inject } from '@angular/core';
import { ref, remove, set } from 'firebase/database';
import { listVal, objectVal } from 'rxfire/database';
import { Observable, map } from 'rxjs';
import { TodoList, User } from '../models';
import { AuthService } from './auth.service';
import { FIREBASE_DATABASE } from './firebase.providers';

/** Payload encoded in the QR code a user shows to share one of their lists. */
export interface SharePayload {
  uid: string;
  todoList: Pick<TodoList, 'id' | 'read' | 'write'>;
}

// Both fields are interpolated into a Firebase path. Auth UIDs and push() keys
// are drawn from this alphabet, and the payload comes from a scanned QR code,
// so anything outside it is not a code this app wrote.
const FIREBASE_KEY = /^[A-Za-z0-9_-]{1,128}$/;

function isKey(value: unknown): value is string {
  return typeof value === 'string' && FIREBASE_KEY.test(value);
}

/** Returns null when the scanned code is not a share payload this app wrote. */
export function parseSharePayload(raw: string): SharePayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }
  const { uid, todoList } = parsed as Record<string, unknown>;
  if (!isKey(uid) || typeof todoList !== 'object' || todoList === null) {
    return null;
  }
  const { id, read, write } = todoList as Record<string, unknown>;
  if (!isKey(id)) {
    return null;
  }
  return {
    uid,
    todoList: { id, read: read === true, write: write === true },
  };
}

@Injectable({ providedIn: 'root' })
export class ShareListService {
  private readonly db = inject(FIREBASE_DATABASE);
  private readonly auth = inject(AuthService);

  uidsSharedWithMe$(): Observable<string[]> {
    return this.uids$('shared-with-me');
  }

  uidsIShareWith$(): Observable<string[]> {
    return this.uids$('i-share-with');
  }

  sharedUser$(uid: string): Observable<User | null> {
    return objectVal<User>(ref(this.db, `/users/${uid}/profile`));
  }

  sharedListIds$(ownerUid: string): Observable<string[]> {
    return listVal<TodoList>(
      ref(this.db, this.path(this.requireUid(), 'shared-with-me', `${ownerUid}/todo-lists`)),
    ).pipe(map((lists) => lists.map((list) => list.id)));
  }

  async addSharedWithMe(payload: SharePayload): Promise<void> {
    const me = this.requireUid();
    await set(ref(this.db, this.path(me, 'shared-with-me', `${payload.uid}/uid`)), payload.uid);
    await set(
      ref(this.db, this.path(me, 'shared-with-me', `${payload.uid}/todo-lists/${payload.todoList.id}`)),
      payload.todoList,
    );
    await this.notifyISharedWith(payload, me);
  }

  async deleteSharedUser(user: User, meThem: boolean): Promise<void> {
    const me = this.requireUid();
    const theirSide = meThem ? 'i-share-with' : 'shared-with-me';
    const mySide = meThem ? 'shared-with-me' : 'i-share-with';
    await remove(ref(this.db, this.path(user.uid, theirSide, me)));
    await remove(ref(this.db, this.path(me, mySide, user.uid)));
  }

  async unshareListWithMe(owner: User, todoList: TodoList): Promise<void> {
    const me = this.requireUid();
    await remove(
      ref(this.db, this.path(owner.uid, 'i-share-with', `${me}/todo-lists/${todoList.id}`)),
    );
    await remove(
      ref(this.db, this.path(me, 'shared-with-me', `${owner.uid}/todo-lists/${todoList.id}`)),
    );
  }

  private async notifyISharedWith(payload: SharePayload, me: string): Promise<void> {
    await set(ref(this.db, this.path(payload.uid, 'i-share-with', `${me}/uid`)), me);
    await set(
      ref(this.db, this.path(payload.uid, 'i-share-with', `${me}/todo-lists/${payload.todoList.id}`)),
      payload.todoList,
    );
  }

  private uids$(branch: 'shared-with-me' | 'i-share-with'): Observable<string[]> {
    return listVal<{ uid: string }>(
      ref(this.db, this.path(this.requireUid(), branch)),
    ).pipe(map((entries) => entries.map((entry) => entry.uid)));
  }

  private path(uid: string, branch: string, tail = ''): string {
    return `/users/${uid}/${branch}${tail ? `/${tail}` : ''}`;
  }

  private requireUid(): string {
    const uid = this.auth.uid;
    if (!uid) {
      throw new Error('No signed-in user');
    }
    return uid;
  }
}
