import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavParams } from 'ionic-angular';
import QRCode from 'qrcode'
import { AuthProvider, ShareListProvider } from '../../core';
import { User, TodoList, CustomAlert } from '../../models';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { AlertProvider } from '../../shared';

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
  userObservables: Observable<User>[];
  uidsSubscription$: Subscription;
  _showHideSearchBar: boolean = true;
  _hideSegment: boolean = true;
  sharedList: TodoList = {};
  keyWord: string;
  selection: string = 'shared-users';
  @ViewChild('qrimage') qrImage: ElementRef;

  constructor(private _AuthProvider: AuthProvider, private nav: NavParams,
    private _ShareListProvider: ShareListProvider, private alert: AlertProvider) { }

  ngOnInit() {
    const list: TodoList = this.nav.get('sharedList');
    if (!!list) {
      this.sharedList.id = list.id;
      this.sharedList.write = true;
      this.sharedList.read = true;
      this._hideSegment = false;
      this.selection = 'qr-scanner';
    }
    this._ShareListProvider.getUidsIShareWith()
      .then(uidObservable => this.uidsSubscription$ = uidObservable
        .map(uids => uids
          .map(uid => this._ShareListProvider
            .getSharedUserData(uid)))
        .subscribe(observables => this.userObservables = observables));
  }

  ngAfterViewInit() {
    const options = {
      width: 300,
      height: 300
    };
    this._AuthProvider.getUserData().then((_user: string) => {
      const user: User = JSON.parse(_user);
      const sharedData: string = JSON.stringify({
        uid: user.uid,
        todoList: this.sharedList,
      });
      console.log('data', JSON.parse(sharedData));

      QRCode.toCanvas(this.qrImage.nativeElement, sharedData, options, error => {
        if (error) console.error(error);
      })
    }
    )
  }

  deleteUser(user: User) {
    const alert: CustomAlert = {
      title: 'Stop sharing',
      message: `Are you sure you want to stop sharing with ${user.displayName}?`,
      inputs: [],
      noText: 'Cancel',
      yesText: 'Yes',
      yesToastThen: 'Shared User deleted',
      yesToastCatch: 'Something wrong happened',
      yesFunction: (_ => this._ShareListProvider.deleteSharedUser(user, false))
    }
    this.alert.createAlert(alert);
  }

  ngOnDestroy() {
    if (this.uidsSubscription$) this.uidsSubscription$.unsubscribe();
  }

}
