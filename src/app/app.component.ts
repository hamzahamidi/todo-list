import { Component, ViewChild } from '@angular/core';
import { Platform, App, Nav } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AuthProvider } from '../core';
import { User, CustomAlert } from '../models';
import { AlertProvider } from '../shared';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = 'AuthPage';
  user: User;
  @ViewChild(Nav) nav: Nav;
  activePage: string;

  constructor(platform: Platform, app: App, private statusBar: StatusBar, splashScreen: SplashScreen,
    private _AuthProvider: AuthProvider, private alert: AlertProvider) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleLightContent();
      this.statusBar.backgroundColorByHexString('#87173c');
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
     // else if (this.rootPage != 'AuthPage') this.signOut();
    })
  }

  goToMyNotes() {
    this.rootPage = 'HomePage';
  }
  
  
  goToMySharedNotes() {

  }
  
  goToShareMyNotes() {
    this.rootPage = 'ShareMyNotesPage'
  }

  confirmSignOut(){
    const alert: CustomAlert = {
      title: 'Are you sure you want to sign out?',
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
    return this._AuthProvider.signOut()
    .then(_ => this.rootPage = 'AuthPage')
    .catch(err => console.log('error:', err))
  }
  
  closeMenu(){
    this.statusBar.overlaysWebView(false);
    this.statusBar.backgroundColorByHexString('#87173c');
  }
  
  dragMenu(){
    this.statusBar.overlaysWebView(true);
  }
}