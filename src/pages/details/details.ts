import { Component } from '@angular/core';
import { IonicPage, NavParams, ModalController } from 'ionic-angular';
import { TodoList, Item, CustomAlert } from '../../models';

// Providers
import { TodoListProvider } from '../../core';
import { AlertProvider } from '../../shared';
import { Subscription } from 'rxjs/Subscription';

/**
 * Generated class for the DetailsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-details',
  templateUrl: 'details.html',
})
export class DetailsPage {
  subscriberTodoList$: Subscription;
  todoList: TodoList;

  constructor(private navParams: NavParams, private modalCtrl: ModalController,
    private _TodoListProvider: TodoListProvider, private alert: AlertProvider) {
  }

  ngOnInit() {
    this.todoList = this.navParams.get('details');
    this.getItem();
  }

  getItem() {
    this.subscriberTodoList$ = this._TodoListProvider.getOneList(this.todoList.id).subscribe(todoList => {
      this.todoList = todoList;
      for (const i in this.todoList.items) {
        if (this.todoList.items.hasOwnProperty(i)) {
          const item = this.todoList.items[i];
          if (item.image) this.loadImg(item);
        }
      }
    });
  }

  addItem() {
    let itemModal = this.modalCtrl.create('ItemDetailsPage', { addOrEdit: true, todoList: this.todoList });
    itemModal.onDidDismiss(noChange => {
      if (!noChange) this.getItem();
    });
    itemModal.present();
  }

  deleteItem(item: Item) {
    const alert: CustomAlert = {
      title: 'Delete Note',
      message: "Are you sure you want to delete this Note?",
      inputs: [],
      noText: 'Cancel',
      yesText: 'Yes',
      yesToastThen: 'Note succesfuly deleted',
      yesToastCatch: 'Something wrong happened',
      yesFunction: (_ => {
        this.getItem();
        return this._TodoListProvider.deleteItem(this.todoList, item)
      })
    }
    this.alert.createAlert(alert);
  }

  updateItem(item: Item) {
    let itemModal = this.modalCtrl.create('ItemDetailsPage', { addOrEdit: false, todoList: this.todoList, item: item });
    itemModal.onDidDismiss(noChange => {
      if (!noChange) this.getItem();
    });
    itemModal.present();
  }

  presentToast(message: string) {
    this.alert.presentToast(message);
  }

  private loadImg(item: Item) {    
    const img = new Image;
    img.onload = _ => {
      (<any>document.getElementById(item.id)).getContext("2d").drawImage(img, 0, 0, 300, 300);
    }
    img.src = item.image;
  }

  ngOnDestroy() {
    if (this.subscriberTodoList$) this.subscriberTodoList$.unsubscribe();
  }
}
