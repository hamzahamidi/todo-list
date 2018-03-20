import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
import { Subscription } from 'rxjs/Subscription';

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
  scanSub$: Subscription;
  selection: string;
  _showHideSearchBar: boolean;
  _transparentBackGroundColor: boolean;
  constructor(public navCtrl: NavController, public navParams: NavParams, private qrScanner: QRScanner) {
  }

  ngOnInit() {
    this.selection = 'qr-scanner';
  }

  scanQR() {
    this.changebackGroundColor(true);
    this.qrScanner.prepare()
      .then((status: QRScannerStatus) => {
        console.log('start');
        if (status.authorized) {
          // camera permission was granted
          console.log('authorized');


          // start scanning
          this.scanSub$ = this.qrScanner.scan().subscribe((text: string) => {
            console.log('Scanned', text);

            this.qrScanner.hide(); // hide camera preview
            this.changebackGroundColor(false);
            this.scanSub$.unsubscribe(); // stop scanning
          });

          this.qrScanner.resumePreview();
          // show camera preview
          this.qrScanner.show()



          // wait for user to scan something, then the observable callback will be called

        } else if (status.denied) {
          console.log('denied');

          // camera permission was permanently denied
          // you must use QRScanner.openSettings() method to guide the user to the settings page
          // then they can grant the permission from there
        } else {
          console.log('else denied');
          // permission was denied, but not permanently. You can ask for permission again at a later time.
        }
      })
      .catch((e: any) => console.log('Error is', e));
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

  cancelScan(){
    if (this.scanSub$) this.scanSub$.unsubscribe();
    this.changebackGroundColor(false);
  }

  ngOnDestroy() {
    this.cancelScan();
  }
}
