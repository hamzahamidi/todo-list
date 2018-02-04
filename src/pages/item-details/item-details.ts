import { Component } from '@angular/core';
import { IonicPage, NavParams, ViewController, ToastController } from 'ionic-angular';
import { Item, TodoList } from '../../models/todo-list';
import { TodoListProvider } from '../../providers/todo-list.service';

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
  todoList: TodoList;
  _item: Item;

  constructor(private navParams: NavParams, private viewCtrl: ViewController, private _TodoListProvider: TodoListProvider,
    private toastCtrl: ToastController, ) {
  }

  ngOnInit() {
    this._item = new Item('', false, '');
    this._AddOrEdit = !!this.navParams.get('addOrEdit');
    this.todoList = this.navParams.get('todoList');
    if (!this._AddOrEdit) this._item = this.navParams.get('item');    
  }
  addItem() {
    this._TodoListProvider
      .addItem(this.todoList, this._item)
      .then(_ => {
        this.presentToast('Task succesfuly added');
        this.leave();
      })
      .catch(err => {
        this.presentToast('Something wrong happened');
        this.leave();
      });
  }
  updateItem() {
    this._TodoListProvider
      .updateItem(this.todoList, this._item)
      .then(_ => {
        this.presentToast('Task succesfuly updated');
        this.leave();
      })
      .catch(err => {
        this.presentToast('Something wrong happened');
        this.leave();
      });
  }

  presentToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      cssClass: "text-center",
    });
    toast.present();
  }

  leave(noChange?) {
    this.viewCtrl.dismiss(noChange);
  }

}
