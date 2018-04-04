import { Component  } from '@angular/core';
import { Platform, App } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AuthProvider } from '../core';
import { User, CustomAlert } from '../models';
import { AlertProvider } from '../shared';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = 'AuthPage';ViewChild
  user: User;

  constructor(platform: Platform, app: App, private statusBar: StatusBar, splashScreen: SplashScreen,
    private _AuthProvider: AuthProvider, private alert: AlertProvider) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      //this.statusBar.styleLightContent();
      //this.statusBar.overlaysWebView(false);
      this.statusBar.backgroundColorByHexString('#33000000');
      splashScreen.hide();
    });
    app.viewDidEnter.subscribe(view => this.getUserData());
  }
  getUserData() {
    this._AuthProvider.getUserData().then(user => {
      console.log('user from storage:', user);
      console.log('rootPage:', this.rootPage);
      if (!!user) {
        this.user = JSON.parse(user);
        if (this.rootPage == 'AuthPage') this.rootPage = 'HomePage';
      }
      else if (this.rootPage != 'AuthPage') this.signOut();
    })
  }

  goToMyNotes() {
    this.rootPage = 'HomePage';
  }


  goToMySharedNotes() {
    this.rootPage = 'SharedWithMePage';
  }

  goToShareMyNotes() {
    this.rootPage = 'ShareMyNotesPage'
  }

  confirmSignOut() {
    const alert: CustomAlert = {
      title: 'Sign Out?',
      message: "You may loose all cached notes!",
      inputs: [],
      noText: 'Cancel',
      yesText: 'Yes',
      yesToastThen: 'Succesfuly signed out',
      yesToastCatch: 'Something wrong happened',
      yesFunction: (_ => this.signOut())
    }
    this.alert.createAlert(alert);
  }
  signOut(): Promise<any> {
    const promise = this._AuthProvider.signOut();
    this.rootPage = 'AuthPage';
    return promise
      .catch(err => console.log('error:', err))
  }

  closeMenu() {
    // this.statusBar.overlaysWebView(false);
    // this.statusBar.backgroundColorByHexString('#87173c');
  }

  dragMenu() {
    //this.statusBar.overlaysWebView(true);
  }
}