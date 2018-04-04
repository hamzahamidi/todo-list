import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';
import { User } from '../models';
import { GooglePlus } from '@ionic-native/google-plus';
import { Platform, LoadingController, Loading } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';
import { Storage } from '@ionic/storage';

@Injectable()
export class AuthProvider {
  loading: Loading;
  user: Observable<User>;
  constructor(private plt: Platform, private afAuth: AngularFireAuth, private db: AngularFireDatabase,
    private googlePlus: GooglePlus, private storage: Storage, private loadingCtrl: LoadingController) { }

  signInGoogle(): Promise<User> {
    this.showLoader();
    //on a device running Android or on a device running iOS.
    if (this.plt.is('cordova')) {
      return this.nativeloginUser();
    }
    // on a desktop device.
    else return this.browserGoogleLogin();

  }

  /**
   * JS method 
   */
  browserGoogleLogin(): Promise<User> {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.oAuthLogin(provider).catch(_ => this.loading.dismiss());
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
      .then(provider => this.oAuthNativeLogin(provider)).catch(_ => this.loading.dismiss());
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
      this.db.list(`/users/${user.uid}`).set('profile', user);
    }
    this.loading.dismiss();
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
        if (this.plt.is('cordova')) {
          return this.nativeSignOut();
        }
        // on a desktop device.
        else  return Promise.resolve(null);
      }
      )
  }
  nativeSignOut(): Promise<any> {
    return this.googlePlus.disconnect();
  }

  showLoader() {
    this.loading = this.loadingCtrl.create({
      content: 'Please wait...'
    });
    this.loading.present();
  }
}