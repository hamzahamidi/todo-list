import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
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
import { map } from 'rxjs';
import { parseSharePayload, ShareListService } from '../../core';
import { CustomAlert, User } from '../../models';
import { AlertService, EmptyListComponent, NavBarComponent } from '../../shared';

/** Both native scanners reject `scan()` with this exact message when the user dismisses the scanner UI. */
const SCAN_CANCELED = 'scan canceled.';

function isScanCanceled(error: unknown): boolean {
  return error instanceof Error && error.message === SCAN_CANCELED;
}

@Component({
  selector: 'app-shared-with-me',
  templateUrl: './shared-with-me.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
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
  private readonly router = inject(Router);

  protected readonly showSearchBar = signal(false);

  protected readonly sharedUsers = toSignal(
    this.shareList
      .uidsSharedWithMe$()
      .pipe(map((uids) => uids.map((uid) => ({ uid, user$: this.shareList.sharedUser$(uid) })))),
  );

  constructor() {
    addIcons({ checkmark, trash });
  }

  protected toggleSearchBar(): void {
    this.showSearchBar.update((shown) => !shown);
  }

  protected goToLists(user: User): void {
    void this.router.navigate(['/home', user.uid]);
  }

  protected deleteUser(user: User): void {
    const alert: CustomAlert = {
      title: 'Unshare list',
      message: `Are you sure you want to unshare lists from ${user.displayName}?`,
      inputs: [],
      noText: 'Cancel',
      yesText: 'Yes',
      yesToastThen: 'Shared User deleted',
      yesToastCatch: 'Something wrong happened',
      yesFunction: () => this.shareList.deleteSharedUser(user, true),
    };
    void this.alert.createAlert(alert);
  }

  protected async scanQR(): Promise<void> {
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported || !Capacitor.isNativePlatform()) {
        await this.alert.presentToast('QR scanning is only available in the app');
        return;
      }

      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== 'granted' && camera !== 'limited') {
        await this.alert.presentToast('camera permission was permanently denied');
        return;
      }

      await this.installScannerModule();

      const { barcodes } = await BarcodeScanner.scan();
      const rawValue = barcodes[0]?.rawValue;
      if (!rawValue) {
        return;
      }

      await this.addSharedList(rawValue);
    } catch (e) {
      if (isScanCanceled(e)) {
        return;
      }
      await this.alert.presentToast(`Error is  ${e}`);
    }
  }

  private async addSharedList(rawValue: string): Promise<void> {
    const payload = parseSharePayload(rawValue);
    if (!payload) {
      await this.alert.presentToast('Invalid QR code');
      return;
    }
    try {
      await this.shareList.addSharedWithMe(payload);
      await this.alert.presentToast('Shared List succefully added');
    } catch (err) {
      await this.alert.presentToast(`Invalid QR ${err}`);
    }
  }

  /** Installing the Google scanner module only starts the download; it is not ready when this resolves. */
  private async installScannerModule(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }
    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (!available) {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
    }
  }
}
