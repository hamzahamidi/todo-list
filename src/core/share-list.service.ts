import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';
import { User } from '../models';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from 'angularfire2/database';
import { Storage } from '@ionic/storage';

@Injectable()
export class ShareListProvider {
  user: User;
  usersIShareWith: AngularFireList<User>;
  usersSharedWithMe: AngularFireList<User>;
  sharedWithMeUrl: string;
  iShareWithUrl: string;
  constructor(private db: AngularFireDatabase,
    private storage: Storage) { }

  ngOnInit() {
    this.getUser();
  }
  getUidsSharedWithMe() {
    return this.getUser().then(user => this.getSettings(this.usersSharedWithMe));
  }
  getUidsIShareWith(): Promise<Observable<string[]>> {
    return this.getUser().then(user => this.getSettings(this.usersIShareWith));
  }

  getUser(): Promise<User> {
    return this.storage.get("user").then(_user => {
      this.user = JSON.parse(_user);
      this.iShareWithUrl = `/users/${this.user.uid}/i-share-with`;
      this.usersIShareWith = this.db.list(this.iShareWithUrl);
      this.sharedWithMeUrl = `/users/${this.user.uid}/shared-with-me`;
      this.usersSharedWithMe = this.db.list(this.sharedWithMeUrl);
      return this.user;
    });
  }

  private getSettings(userList: AngularFireList<User>): Observable<string[]> | PromiseLike<Observable<string[]>> {
    return userList
      .valueChanges()
      .map(settings => settings
        .map(singleUser => singleUser.uid));
  }

  addSharedWithMe(sharedData): Promise<void> {
    const uidBaseList = this.db.list(`${this.sharedWithMeUrl}/${sharedData.uid}`);
    const todoListList = this.db.list(`${this.sharedWithMeUrl}/${sharedData.uid}/todo-lists`);
    return uidBaseList.set('uid', sharedData.uid)
      .then(_ => todoListList.set(sharedData.todoList.id, sharedData.todoList))
      .then(_ => this.notifyISharedWith(sharedData));
  }

  notifyISharedWith(sharedData): Promise<void> {
    const uidBaseList = this.getListIshareWith(sharedData.uid, this.user.uid);
    const todoListList = this.getListIshareWith(sharedData.uid, `${this.user.uid}/todo-lists`);
    return uidBaseList.set('uid', this.user.uid)
      .then(_ => todoListList.set(sharedData.todoList.id, sharedData.todoList));
  }


  deleteSharedWithMe(user: User): Promise<void[]> {
    const notifyUsersISharedWith = this.getListIshareWith(user.uid);
    return Promise
      .all([notifyUsersISharedWith.remove(this.user.uid),
      this.usersSharedWithMe.remove(user.uid)]);
  }


  getSharedUserData(uid: string): Observable<User> {
    const sharedUser: AngularFireObject<User> = this.db.object(`/users/${uid}/profile`);
    return sharedUser.valueChanges();
  }

  private getListIshareWith(uid: string, pathEnd: string = '') {
    return this.db.list(`/users/${uid}/i-share-with/${pathEnd}`);
  }
  
  checkUserExists(uid: string) {
    // todo
  }
}