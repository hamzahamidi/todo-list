import { Injectable } from '@angular/core';
import { ToastController, AlertController } from 'ionic-angular';
import { CustomAlert } from '../models'
/*
  Generated class for the AlertProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AlertProvider {

  constructor(private toastCtrl: ToastController, private alertCtrl: AlertController) { }

  presentToast(message: string): void {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      cssClass: "text-center",
    });
    toast.present();
  }

  createAlert(alert: CustomAlert): void {
    let prompt = this.alertCtrl.create({
      title: alert.title,
      message: alert.message,
      inputs: alert.inputs,
      buttons: [
        {
          text: alert.noText,
          handler: data => { }
        },
        {
          text: alert.yesText,
          handler: data => alert.yesFunction(data)
            .then(_ => this.presentToast(alert.yesToastThen))
            .catch(err => this.presentToast(alert.yesToastCatch))
        }
      ]
    });
    prompt.present();
  }
}
