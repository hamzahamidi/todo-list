import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http'; 

// Import the AngularFire2 Module
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFirestoreModule } from 'angularfire2/firestore';

// Providers
import { GooglePlus } from '@ionic-native/google-plus';
import { AuthProvider, TodoListProvider } from '../providers';

// Import the AngularFire2 Module
import { AngularFireModule } from 'angularfire2';

// Export AngularFire2 settings
export const firebaseConfig = {
  apiKey: "AIzaSyAzamPI7qF93z18oStf4b_iuyJ5ROhtTvo",
  authDomain: "m2gi-ionic-21b7b.firebaseapp.com",
  databaseURL: "https://m2gi-ionic-21b7b.firebaseio.com",
  projectId: "m2gi-ionic-21b7b",
  storageBucket: "m2gi-ionic-21b7b.appspot.com",
  messagingSenderId: "588101161325"
};

// Storage
import { IonicStorageModule } from '@ionic/storage';


@NgModule({
  imports: [
    HttpClientModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AngularFirestoreModule,
    IonicStorageModule.forRoot()
  ],
  providers: [GooglePlus, AuthProvider, TodoListProvider]
})
export class CoreModule { }