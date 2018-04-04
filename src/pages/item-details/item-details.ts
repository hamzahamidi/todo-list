import { Component, ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavParams, ViewController } from 'ionic-angular';
import { Item, TodoList } from '../../models';
import { TodoListProvider } from '../../core';
import { AlertProvider, MediaProvider, SpeechProvider } from '../../shared';

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
  matches: string[];
  _AddOrEdit: boolean;
  _pictureReady: boolean;
  todoList: TodoList;
  _item: Item;

  constructor(private navParams: NavParams, private viewCtrl: ViewController, private _TodoListProvider: TodoListProvider,
    private alert: AlertProvider, private media: MediaProvider, private _SpeechProvider: SpeechProvider,
    private cd: ChangeDetectorRef) {
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

  inputVoice(text: string) {
    this._SpeechProvider.checkAvailable()
      .then(ready => {
        console.log('ready', ready);
        if (ready) {
          this._SpeechProvider.startListening()
            .subscribe(matches => {
              if (text == 'title') this._item.name = matches[0];
              else if (text == 'description') this._item.description = matches[0];
              this.cd.detectChanges();
            });
        }
      }
      )
  }

  stopInputVoice() {
    this._SpeechProvider.stopListening();
  }

  leave(noChange?) {
    this.viewCtrl.dismiss(noChange);
  }
}
