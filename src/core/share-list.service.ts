import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { User, TodoList } from '../models';
import { AngularFireDatabase, AngularFireObject, AngularFireList } from 'angularfire2/database';
import { Storage } from '@ionic/storage';

@Injectable()
export class ShareListProvider {
  user: User;
  constructor(private db: AngularFireDatabase,
    private storage: Storage) { }

  ngOnInit() {
    this.getUser();
  }
  getUidsSharedWithMe(): Promise<Observable<string[]>> {
    return this.getUids('shared-with-me');

  }
  getUidsIShareWith(): Promise<Observable<string[]>> {
    return this.getUids('i-share-with');
  }
  private getUids(path: string): Promise<Observable<string[]>> {
    return this.getUser().then(user => this.getSettings(this.getAngularFireList(this.user.uid, path)));
  }

  getUser(): Promise<User> {
    return this.storage.get("user").then(user => this.user = JSON.parse(user));
  }

  private getSettings(userList): Observable<string[]> | PromiseLike<Observable<string[]>> {
    return userList
      .valueChanges()
      .map(settings => settings
        .map(singleUser => singleUser.uid));
  }

  addSharedWithMe(sharedData): Promise<void> {
    const uidBaseList = this.getAngularFireList(this.user.uid, 'shared-with-me', sharedData.uid);
    const todoListList = this.getAngularFireList(this.user.uid, 'shared-with-me', `${sharedData.uid}/todo-lists`);
    return uidBaseList.set('uid', sharedData.uid)
      .then(_ => todoListList.set(sharedData.todoList.id, sharedData.todoList))
      .then(_ => this.notifyISharedWith(sharedData));
  }

  notifyISharedWith(sharedData): Promise<void> {
    const uidBaseList = this.getAngularFireList(sharedData.uid, 'i-share-with', this.user.uid);
    const todoListList = this.getAngularFireList(sharedData.uid, 'i-share-with', `${this.user.uid}/todo-lists`);
    return uidBaseList.set('uid', this.user.uid)
      .then(_ => todoListList.set(sharedData.todoList.id, sharedData.todoList));
  }

  deleteSharedUser(user: User, meThem: boolean): Promise<void> {
    const iShareWith: string = meThem ? 'i-share-with' : 'shared-with-me';
    const sharedWithMe: string = meThem ? 'shared-with-me' : 'i-share-with';
    const notifyUserISharedWith = this.getAngularFireList(user.uid, iShareWith);
    const userSharedWithMe = this.getAngularFireList(this.user.uid, sharedWithMe);
    return notifyUserISharedWith.remove(this.user.uid)
      .then(_ => userSharedWithMe.remove(user.uid));
  }


  getSharedUserData(uid: string): Observable<User> {
    const sharedUser: AngularFireObject<User> = this.db.object(`/users/${uid}/profile`);
    return sharedUser.valueChanges();
  }

  unshareListWithMe(user: User, todoList: TodoList): Promise<void> {
    const notifyUserWhoShareWithMe = this.getAngularFireList(user.uid, `i-share-with/${this.user.uid}/todo-lists`);
    const listSharedWithMe = this.getAngularFireList(this.user.uid, `shared-with-me/${user.uid}/todo-lists`);
    return notifyUserWhoShareWithMe.remove(todoList.id)
      .then(_ => listSharedWithMe.remove(todoList.id));
  }
  private getAngularFireList(uid: string, pathMiddle: string, pathEnd: string = ''):
    AngularFireList<string | User | TodoList> {
    return this.db.list(`/users/${uid}/${pathMiddle}/${pathEnd}`);
  }

  checkUserExists(uid: string) {
    // todo
  }

  getIdListsShared(uid: string): Promise<Observable<string[]>> {
    return this.getUser()
      .then(user => this.getAngularFireList(this.user.uid, 'shared-with-me', `${uid}/todo-lists`)
        .valueChanges()
        .map(settings => settings
          .map((todoList: TodoList) => todoList.id)));
  }
}