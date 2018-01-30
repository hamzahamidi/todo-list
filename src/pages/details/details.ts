import { Component } from '@angular/core';
import { IonicPage, NavParams, ToastController, ModalController } from 'ionic-angular';
import { TodoList } from '../../models/todo-list';

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

  constructor(public navParams: NavParams, private toastCtrl: ToastController, private modalCtrl: ModalController) {
  }

  ngOnInit() {
    this.todoList = this.navParams.get('details');
  }
  addItem() {
    let profileModal = this.modalCtrl.create('ItemDetailsPage', { addOrEdit: true, todoList: this.todoList });
    profileModal.present();
  }

  deleteList(todoList: TodoList) {
    /*let prompt = this.alertCtrl.create({
      title: 'Delete List',
      message: "Are you sure you want to delete this list?",
      buttons: [
        {
          text: 'Cancel',
          handler: data => { }
        },
        {
          text: 'Yes',
          handler: _ => this._TodoListProvider
            .deleteList(todoList)
            .then(_ => this.presentToast('List succesfuly deleted'))
            .catch(err => _ => this.presentToast('Something wrong happened'))
        }
      ]
    });
    prompt.present();*/
  }

  updateList(todoList: TodoList) {
    /*let prompt = this.alertCtrl.create({
      title: 'Update List Name',
      message: "Enter the new list name",
      inputs: [
        {
          name: 'name',
          placeholder: 'New Title'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => { }
        },
        {
          text: 'Save',
          handler: data => this._TodoListProvider
            .updateList(todoList, data.name)
            .then(_ => this.presentToast('List name succesfuly updated'))
            .catch(err => _ => this.presentToast('Something wrong happened'))

        }
      ]
    });
    prompt.present();*/
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
