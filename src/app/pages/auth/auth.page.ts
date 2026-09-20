import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonInput,
  IonItem,
  IonRow,
  LoadingController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logoFacebook, logoGoogle } from 'ionicons/icons';
import { AuthService } from '../../core';

@Component({
  selector: 'app-auth',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth.page.html',
  imports: [IonContent, IonGrid, IonRow, IonCol, IonItem, IonInput, IonButton, IonIcon],
})
export class AuthPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly loadingCtrl = inject(LoadingController);

  constructor() {
    addIcons({ logoGoogle, logoFacebook });
  }

  protected async signInGoogle(): Promise<void> {
    // Opening the Google popup has to happen in the click's own frame, before the
    // loader is awaited, or the browser treats it as unrequested and blocks it.
    const signIn = this.auth.signInGoogle();
    signIn.catch(() => undefined);

    const loading = await this.loadingCtrl.create({ message: 'Please wait...' });
    await loading.present();
    try {
      await signIn;
    } catch {
      await loading.dismiss();
      return;
    }
    await loading.dismiss();
    await this.router.navigateByUrl('/home');
  }
}
