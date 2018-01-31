import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
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

  constructor(public navCtrl: NavController, public _AuthProvider: AuthProvider) {
  }

  ngOnInit() {
  }

  signInGoogle($event) {
    this._AuthProvider.googleLogin()
      .then((res: any) => {
        this.navCtrl.setRoot('HomePage');
        // Google Access Token. 
        this.token = res.credential.accessToken;
        //console.log('token:', this.token);
        // The signed-in user info.
        this.user = res.user;
        //console.log('user:', this.user);
      })
      .catch(err => console.log('error:', err))
  }

  signIn(){
    console.log('comming soon!');
    
  }

}
