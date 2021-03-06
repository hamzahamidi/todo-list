import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
import { Subscription } from 'rxjs/Subscription';
import { ShareListProvider } from '../../core';
import { Observable } from 'rxjs/Observable';
import { User, CustomAlert } from '../../models';
import { AlertProvider } from '../../shared';

/**
 * Generated class for the SharedWithMePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-shared-with-me',
  templateUrl: 'shared-with-me.html',
})
export class SharedWithMePage {
  test: Set<Observable<User>>;
  userObservables: Observable<User>[];
  uidsSubscription$: Subscription;
  scanSub$: Subscription;
  _showHideSearchBar: boolean;
  _transparentBackGroundColor: boolean;
  constructor(public navCtrl: NavController, private qrScanner: QRScanner,
    private _ShareListProvider: ShareListProvider, private alert: AlertProvider) {
  }

  ngOnInit() {
    this._ShareListProvider.getUidsSharedWithMe()
      .then(uidObservable => this.uidsSubscription$ = uidObservable
        .map(uids => uids
          .map(uid => this._ShareListProvider
            .getSharedUserData(uid)))
        .subscribe(observables => this.userObservables = observables));
  }

  scanQR() {
    this.changebackGroundColor(true);
    this.qrScanner.prepare()
      .then((status: QRScannerStatus) => {
        if (status.authorized) {
          this.scanSub$ = this.qrScanner.scan().subscribe(data => {
            console.log('Scanned', data);
            const dataJson = JSON.parse(data);
            this.qrScanner.hide(); // hide camera preview
            this.changebackGroundColor(false);
            this.scanSub$.unsubscribe(); // stop scanning
            this._ShareListProvider.addSharedWithMe(dataJson)
              .then(_ => this.alert.presentToast('Shared List succefully added'))
              .catch(err => this.alert.presentToast(`Invalid QR ${err}`));
          });

          this.qrScanner.resumePreview();
          // show camera preview
          this.qrScanner.show()
          // wait for user to scan something, then the observable callback will be called
        } else {
          // camera permission was permanently denied
          // you must use QRScanner.openSettings() method to guide the user to the settings page
          // then they can grant the permission from there
          this.alert.presentToast(`camera permission was permanently denied`);
        }
      })
      .catch((e: any) => this.alert.presentToast(`Error is  ${e}`));
  }

  changebackGroundColor(_transparentBackGroundColor: boolean) {
    const app = <any>document.getElementsByTagName("ION-APP")[0];
    if (_transparentBackGroundColor) {
      app.classList.add('transparent');
      this._transparentBackGroundColor = true;
    }
    else {
      app.classList.remove('transparent');
      this._transparentBackGroundColor = false;
    }
  }

  cancelScan() {
    if (this.scanSub$) this.scanSub$.unsubscribe();
    this.changebackGroundColor(false);
  }

  goToLists(user: User) {
    console.log('user', user);
    this.navCtrl.push('HomePage', { sharedwithMeUser: user })
  }

  deleteUser(user: User) {
    const alert: CustomAlert = {
      title: 'Unshare list',
      message: `Are you sure you want to unshare lists from ${user.displayName}?`,
      inputs: [],
      noText: 'Cancel',
      yesText: 'Yes',
      yesToastThen: 'Shared User deleted',
      yesToastCatch: 'Something wrong happened',
      yesFunction: (_ => this._ShareListProvider.deleteSharedUser(user, true))
    }
    this.alert.createAlert(alert);
  }


  ngOnDestroy() {
    this.cancelScan();
    if (this.uidsSubscription$) this.uidsSubscription$.unsubscribe();
  }
}
