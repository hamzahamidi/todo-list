import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonAvatar,
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonItem,
  IonItemDivider,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmark, trash } from 'ionicons/icons';
import { ShareListService } from '../../core';
import { AlertService, EmptyListComponent, NavBarComponent } from '../../shared';

@Component({
  selector: 'app-shared-with-me',
  templateUrl: './shared-with-me.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NavBarComponent,
    EmptyListComponent,
    IonContent,
    IonSearchbar,
    IonList,
    IonItemDivider,
    IonItemSliding,
    IonItem,
    IonItemOptions,
    IonItemOption,
    IonAvatar,
    IonLabel,
    IonIcon,
    IonSpinner,
    IonFooter,
    IonButton,
  ],
})
export class SharedWithMePage {
  private readonly shareList = inject(ShareListService);
  private readonly alert = inject(AlertService);

  protected readonly showSearchBar = signal(false);
  protected readonly sharedUsers = toSignal(this.shareList.sharedWithMe$());

  constructor() {
    addIcons({ checkmark, trash });
  }

  protected toggleSearchBar(): void {
    this.showSearchBar.update((shown) => !shown);
  }

  protected deleteUser(): void {
    void this.alert.presentToast('Sharing is being rebuilt');
  }

  protected scanQR(): void {
    void this.alert.presentToast('Sharing is being rebuilt');
  }
}
