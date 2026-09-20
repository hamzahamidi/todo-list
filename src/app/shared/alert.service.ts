import { Injectable, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { CustomAlert } from '../models';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly toastCtrl = inject(ToastController);
  private readonly alertCtrl = inject(AlertController);

  async presentToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      cssClass: 'text-center',
    });
    await toast.present();
  }

  async createAlert(alert: CustomAlert): Promise<void> {
    const prompt = await this.alertCtrl.create({
      header: alert.title,
      message: alert.message,
      inputs: alert.inputs ?? [],
      buttons: [
        { text: alert.noText ?? 'Cancel', role: 'cancel' },
        {
          text: alert.yesText ?? 'Yes',
          handler: (data: Record<string, string>) => {
            void this.run(alert, data);
          },
        },
      ],
    });
    await prompt.present();
  }

  private async run(alert: CustomAlert, data: Record<string, string>): Promise<void> {
    try {
      await alert.yesFunction?.(data);
      if (alert.yesToastThen) {
        await this.presentToast(alert.yesToastThen);
      }
    } catch {
      if (alert.yesToastCatch) {
        await this.presentToast(alert.yesToastCatch);
      }
    }
  }
}
