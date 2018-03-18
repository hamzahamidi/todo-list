import { Component } from '@angular/core';
import { NavController, AlertController, IonicPage, ToastController } from 'ionic-angular';
import { TodoList } from '../../models';
import { TodoListProvider } from '../../providers';
import { Observable } from 'rxjs/Observable';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  todoLists$: Observable<TodoList[]>;
  _showHideSearchBar:boolean=true;
  constructor(private navCtrl: NavController, private _TodoListProvider: TodoListProvider, private alertCtrl: AlertController,
    private toastCtrl: ToastController) {

  }

  ngOnInit() {
    this.getList();
  }

  getList() {
    this._TodoListProvider.getTodoList().then(observableTodoList => this.todoLists$ = observableTodoList);
  }

  addList() {
    let prompt = this.alertCtrl.create({
      title: 'List Name',
      message: "Enter a name for this new list",
      inputs: [
        {
          name: 'name',
          placeholder: 'Title'
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
            .addList(data)
            .then(_ => this.presentToast('List succesfuly added'))
            .catch(err => this.presentToast('Something wrong happened'))

        }
      ]
    });
    prompt.present();
  }

  deleteList(todoList: TodoList) {
    let prompt = this.alertCtrl.create({
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
            .catch(err => this.presentToast('Something wrong happened'))
        }
      ]
    });
    prompt.present();
  }

  updateList(todoList: TodoList) {
    let prompt = this.alertCtrl.create({
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
            .catch(err => this.presentToast('Something wrong happened'))

        }
      ]
    });
    prompt.present();
  }

  presentToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      cssClass: "text-center",
    });
    toast.present();
  }

  refresh(event) {
    /*this.getList();
    setTimeout(() => {
      event.complete();
    }, 2000);*/
  }

  goToDetails(todoLists) {
    this.navCtrl.push('DetailsPage', { details: todoLists });
  }

  refreshLists(refresher){
    this.todoLists$ = Observable.of(null);
    this.getList();
    setTimeout(() => {
      refresher.complete();
    }, 2000);
  }
}
