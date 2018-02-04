import { Component } from '@angular/core';
import { IonicPage, NavParams, ToastController, ModalController, AlertController } from 'ionic-angular';
import { TodoList, Item } from '../../models/todo-list';

// Providers
import { TodoListProvider } from '../../providers/todo-list.service';

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

  constructor(private navParams: NavParams, private toastCtrl: ToastController, private modalCtrl: ModalController,
    private _TodoListProvider: TodoListProvider, private alertCtrl: AlertController) {
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
    let prompt = this.alertCtrl.create({
      title: 'Delete List',
      message: "Are you sure you want to delete this task?",
      buttons: [
        {
          text: 'Cancel',
          handler: data => { }
        },
        {
          text: 'Yes',
          handler: _ => this._TodoListProvider
            .deleteItem(this.todoList, item)
            .then(_ => { this.getItem(); this.presentToast('Task succesfuly deleted'); })
            .catch(err => this.presentToast('Something wrong happened'))
        }
      ]
    });
    prompt.present();
  }

  updateItem(item: Item) {
    let itemModal = this.modalCtrl.create('ItemDetailsPage', { addOrEdit: false, todoList: this.todoList, item: item });
    itemModal.onDidDismiss(noChange => {
      if (!noChange) this.getItem();
    });
    itemModal.present();

  }

  presentToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      cssClass: "text-center",
    });
    toast.present();
  }

}
