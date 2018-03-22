import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';
import { User } from '../models';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from 'angularfire2/database';
import { Storage } from '@ionic/storage';

@Injectable()
export class ShareListProvider {
  uids: AngularFireList<string>;
  baseUrl: string;
  user: Observable<User>;
  constructor(private db: AngularFireDatabase,
    private storage: Storage) { }


  getUidsSharedWithMe(): Promise<Observable<string[]>> {
    return this.storage.get("user").then(_user => {
      const user: User = JSON.parse(_user);
      this.baseUrl = `/users/${user.uid}/shared-with-me/uids`;
      this.uids = this.db.list(this.baseUrl);
      return this.uids.valueChanges();
    })
  }

  addSharedWithMe(uid): Promise<void> {
    return this.uids.set(uid, uid);
  }

  deleteUidSharedWithMe(user: User): Promise<void> {
    return this.uids.remove(user.uid);
  }


  getSharedUserData(uid: string): Observable<User> {
    const sharedUser: AngularFireObject<User> = this.db.object(`/users/${uid}`);
    return sharedUser.valueChanges();
  }

  checkUserExists(uid: string) {
    // todo
  }

}