import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';
import { User } from '../models';
import { GooglePlus } from '@ionic-native/google-plus';
import { Platform } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';
import { Storage } from '@ionic/storage';

@Injectable()
export class AuthProvider {
  user: Observable<User>;
  constructor(private plt: Platform, private afAuth: AngularFireAuth, private db: AngularFireDatabase,
    private googlePlus: GooglePlus, private storage: Storage) { }

  signInGoogle(): Promise<User> {
    //on a device running Android or on a device running iOS.
    if (this.plt.is('ios') || this.plt.is('android')) {
      return this.nativeloginUser();
    }
    // on a desktop device.
    else if (this.plt.is('core')) {
      return this.browserGoogleLogin();
    }
  }

  /**
   * JS method 
   */
  browserGoogleLogin(): Promise<User> {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.oAuthLogin(provider);
  }
  oAuthLogin(provider): Promise<User> {
    return this.afAuth.auth.signInWithPopup(provider)
      .then(credential => this.updateUserData(credential))
  }
  /**
   * native method GooglePlus
   */
  nativeloginUser(): Promise<User> {
    return this.googlePlus.login({
      'webClientId': '588101161325-f3p5ulsoe22ok3gbblq8itej4msbfvht.apps.googleusercontent.com'
    })
      .then(provider => this.oAuthNativeLogin(provider));
  }

  oAuthNativeLogin(provider): Promise<User> {
    const googleCredential = firebase.auth.GoogleAuthProvider.credential(provider.idToken);
    return this.afAuth.auth.signInAndRetrieveDataWithCredential(googleCredential)
      .then(credential => this.updateUserData(credential));
  }

  updateUserData(credential): Promise<User> {
    //console.log('credential:', credential);
    let user: User = {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName,
      photoURL: credential.user.photoURL
    }
    //console.log('user:', user);
    // Check if new user
    if (credential.additionalUserInfo.isNewUser) {
      // Sets user data to firebase on login
      this.db.list(`/users/`).set(user.uid, user);
    }
    return this.storage.set('user', JSON.stringify(user));
  }

  getUserData(): Promise<string> {
    return this.storage.get("user");
  }
  signOut(): Promise<any> {
    return this.storage.clear()
      .then(_ => this.fireBaseSignOut())
  }

  fireBaseSignOut(): Promise<any> {
    return this.afAuth.auth.signOut()
      .then(_ => {
        if (this.plt.is('ios') || this.plt.is('android')) {
          return this.nativeSignOut();
        }
        // on a desktop device.
        else if (this.plt.is('core')) {
          return Promise.resolve(null);
        }
      }
      )
  }
  nativeSignOut(): Promise<any> {
    return this.googlePlus.disconnect();
  }
}