import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { HttpClientModule } from '@angular/common/http'; 
import { HttpModule } from '@angular/http';
import { MyApp } from './app.component';


import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

// Import the AngularFire2 Module
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';

// Export AngularFire2 settings
export const firebaseConfig = {
  apiKey: "AIzaSyAzamPI7qF93z18oStf4b_iuyJ5ROhtTvo",
  authDomain: "m2gi-ionic-21b7b.firebaseapp.com",
  databaseURL: "https://m2gi-ionic-21b7b.firebaseio.com",
  projectId: "m2gi-ionic-21b7b",
  storageBucket: "m2gi-ionic-21b7b.appspot.com",
  messagingSenderId: "588101161325"
};

@NgModule({
  declarations: [MyApp],
  imports: [
    BrowserModule,
    HttpClientModule,
    HttpModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [MyApp],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
