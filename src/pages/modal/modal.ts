import { Component } from '@angular/core';
import { IonicPage, NavParams, ViewController } from 'ionic-angular';
import { ModalButton } from '../../models';
/**
 * Generated class for the ModalPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-modal',
  templateUrl: 'modal.html',
})
export class ModalPage {
  modalButtons: ModalButton[]
  constructor( private navParams: NavParams, private viewCtrl: ViewController) {
  }

  ngOnInit() {
    this.modalButtons = this.navParams.get('modalButtons') || [];
    console.log('ionViewDidLoad ModalPage', this.modalButtons);
  }

  action(modalButton: ModalButton) {
    (modalButton.action)();
    this.viewCtrl.dismiss();
  }

}
