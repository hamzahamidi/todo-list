import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signOut,
  type UserCredential,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { authState } from 'rxfire/auth';
import { Observable, map } from 'rxjs';
import { User } from '../models';
import { FIREBASE_AUTH, FIRESTORE } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly db = inject(FIRESTORE);

  readonly user$: Observable<User | null> = authState(this.auth).pipe(
    map((user) => (user ? toProfile(user) : null)),
  );

  get uid(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  get currentUser(): User | null {
    const user = this.auth.currentUser;
    return user ? toProfile(user) : null;
  }

  async signInGoogle(): Promise<User> {
    const credential = Capacitor.isNativePlatform()
      ? await this.nativeGoogleLogin()
      : await signInWithPopup(this.auth, new GoogleAuthProvider());
    return this.persistProfile(credential);
  }

  async signOut(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut();
    }
    await signOut(this.auth);
  }

  private async nativeGoogleLogin(): Promise<UserCredential> {
    const result = await FirebaseAuthentication.signInWithGoogle();
    const credential = GoogleAuthProvider.credential(
      result.credential?.idToken,
      result.credential?.accessToken,
    );
    return signInWithCredential(this.auth, credential);
  }

  private async persistProfile(credential: UserCredential): Promise<User> {
    const profile = toProfile(credential.user);
    await setDoc(doc(this.db, 'users', profile.uid), profile);
    return profile;
  }
}

function toProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): User {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    photoURL: user.photoURL ?? '',
  };
}
