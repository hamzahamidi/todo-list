import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import QRCode from 'qrcode'
import { AuthProvider } from '../../providers';
import { User } from '../../models';

/**
 * Generated class for the ShareMyNotesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-share-my-notes',
  templateUrl: 'share-my-notes.html',
})
export class ShareMyNotesPage {
  _showHideSearchBar: boolean = true;
  keyWord: string;
  segmentValue: string;
  @ViewChild('qrimage') qrImage: ElementRef;

  constructor(private _AuthProvider: AuthProvider) { }

  ionViewWillEnter() {
    this.segmentValue = 'shared-users';
  }

  ngAfterViewInit() {
    const options = {
      width: 300,
      height: 300
    };
    this._AuthProvider.getUserData().then((_user: string) => {
      const user: User = JSON.parse(_user);
      QRCode.toCanvas(this.qrImage.nativeElement, user.uid, options, error => {
        if (error) console.error(error);
      })
    }
    )
  }

}
