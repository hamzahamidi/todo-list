import { Component } from '@angular/core';
import { IonicPage, NavParams, ModalController } from 'ionic-angular';
import { TodoList, Item } from '../../models/todo-list';

// Providers
import { TodoListProvider } from '../../providers/todo-list.service';
import { AlertProvider } from '../../providers';
import { CustomAlert } from '../../models';

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
  todoList: TodoList;

  constructor(private navParams: NavParams, private modalCtrl: ModalController,
    private _TodoListProvider: TodoListProvider, private alert: AlertProvider) {
  }

  ngOnInit() {
    this.todoList = this.navParams.get('details');
  }

  getItem() {
    this._TodoListProvider.getOneList(this.todoList.id).subscribe(todoList => {
      this.todoList = todoList;
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

}
