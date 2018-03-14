import { Component } from '@angular/core';
import { IonicPage, NavController, MenuController } from 'ionic-angular';
import { AuthProvider } from '../../providers/auth.service';
import { User } from '../../models/user';

/**
 * Generated class for the AuthPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-auth',
  templateUrl: 'auth.html',
})
export class AuthPage {
  user: User;
  token: any; //change later

  constructor(private navCtrl: NavController, private _AuthProvider: AuthProvider, private menuCtrl: MenuController) {
  }

  ionViewDidLoad(){
    this.menuCtrl.enable(false, 'myMenu');
  }
  
  ionViewDidLeave(){
    this.menuCtrl.enable(true, 'myMenu');
  }	

  signInGoogle($event) {
    this._AuthProvider.signInGoogle()
      .then((res) => {
        //console.log('its working', res);
        // The signed-in user info.
        this.navCtrl.setRoot('HomePage', { res: res });
      })
      .catch(err => console.log('error:', err))
  }

  signIn() {
    console.log('comming soon!');
  }

}
