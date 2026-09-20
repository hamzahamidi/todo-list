import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';
import {
  IonApp,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonText,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { listCircle, logOut, people, shareSocial } from 'ionicons/icons';
import { AuthService } from './core';
import { AlertService } from './shared';
import { CustomAlert } from './models';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    IonApp,
    IonMenu,
    IonHeader,
    IonContent,
    IonItem,
    IonIcon,
    IonLabel,
    IonText,
    IonMenuToggle,
    IonRouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly alert = inject(AlertService);
  private readonly router = inject(Router);

  protected readonly user = toSignal(this.auth.user$, { initialValue: null });

  constructor() {
    addIcons({ listCircle, people, shareSocial, logOut });
    void this.prepareNativeChrome();
  }

  protected confirmSignOut(): void {
    const alert: CustomAlert = {
      title: 'Sign Out?',
      message: 'You may lose all cached notes!',
      noText: 'Cancel',
      yesText: 'Yes',
      yesToastThen: 'Successfully signed out',
      yesToastCatch: 'Something wrong happened',
      yesFunction: () => this.signOut(),
    };
    void this.alert.createAlert(alert);
  }

  private async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/auth']);
  }

  private async prepareNativeChrome(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    // setBackgroundColor is Android-only and rejects elsewhere; the original app
    // only ever shipped an Android build.
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#33000000' });
    }
    await SplashScreen.hide();
  }
}
