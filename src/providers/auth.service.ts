import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';
import { User } from '../models/user';
import { GooglePlus } from '@ionic-native/google-plus';

@Injectable()
export class AuthProvider {
  user: Observable<User>;
  constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, private googlePlus: GooglePlus) { }
  /**
   * JS method 
   * No longer used in this application
   */
  googleLogin(): Promise<void> {
    const provider = new firebase.auth.GoogleAuthProvider()
    return this.oAuthLogin(provider);
  }
  private oAuthLogin(provider): Promise<void> {
    return this.afAuth.auth.signInWithPopup(provider)
      .then((credential) => {
        this.updateUserData(credential.user);
      })
  }
  private updateUserData(user): Promise<void> {
    // Sets user data to firestore on login
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    const data: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    }
    return userRef.set(data);
  }
  signOut() {
    return this.afAuth.auth.signOut();
  }

  /**
   * native method GooglePlus
   */
  loginUser(): Promise<void> {
    return this.googlePlus.login({
      'webClientId': '588101161325-f3p5ulsoe22ok3gbblq8itej4msbfvht.apps.googleusercontent.com',
      'offline': true
    });
  }
}