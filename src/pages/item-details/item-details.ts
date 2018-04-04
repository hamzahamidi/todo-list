import { Component } from '@angular/core';
import { IonicPage, NavParams, ViewController } from 'ionic-angular';
import { Item, TodoList } from '../../models';
import { TodoListProvider } from '../../core';
import { AlertProvider, MediaProvider } from '../../shared';

/**
 * Generated class for the ItemDetailsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-item-details',
  templateUrl: 'item-details.html',
})
export class ItemDetailsPage {
  _AddOrEdit: boolean;
  _pictureReady: boolean;
  todoList: TodoList;
  _item: Item;

  constructor(private navParams: NavParams, private viewCtrl: ViewController, private _TodoListProvider: TodoListProvider,
    private alert: AlertProvider, private media: MediaProvider) {
  }

  ngOnInit() {
    this._item = new Item();
    this._AddOrEdit = !!this.navParams.get('addOrEdit');
    this.todoList = this.navParams.get('todoList');
    if (!this._AddOrEdit) {
      this._item = this.navParams.get('item');
      const img = new Image;
      const canvas: any = document.getElementById('picture');
      img.onload = _ => {
        canvas.getContext("2d").drawImage(img, 0, 0, 300, 300);
      }
      img.src = this._item.image;
    }
  }

  addItem() {
    this._TodoListProvider
      .addItem(this.todoList, this._item)
      .then(_ => {
        this.alert.presentToast('Note succesfuly added');
        this.leave();
      })
      .catch(err => {
        this.alert.presentToast('Something wrong happened');
        this.leave();
      });
  }
  updateItem() {
    this._TodoListProvider
      .updateItem(this.todoList, this._item)
      .then(_ => {
        this.alert.presentToast('Note succesfuly updated');
        this.leave();
      })
      .catch(err => {
        this.alert.presentToast('Something wrong happened');
        this.leave();
      });
  }

  getPictureLibrary() {
    this.media.getPictureLibrary()
      .then(img => this.loadImg(img));
  }


  getPictureMedia() {
    this.media.getPictureMedia()
      .then(img => { if (!!img) this.loadImg(img) });;
  }

  takePicture() {
    this.media.browserGetPicture()
      .then(img => this.loadImg(img));
  }

  private loadImg(img) {
    if (!!img) {
      this._pictureReady = true;
      this.cancelTakePicture();
      this._item.image = img;
      console.log('img', img.length);
      console.log('img', img);
    }
  }

  cancelTakePicture() {
    this.media.cancelTakePicture();
  }

  leave(noChange?) {
    this.viewCtrl.dismiss(noChange);
  }
}
