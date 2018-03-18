import { Component } from '@angular/core';
import { NavController, IonicPage } from 'ionic-angular';
import { TodoList, CustomAlert } from '../../models';
import { TodoListProvider } from '../../core';
import { AlertProvider } from '../../shared';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  todoLists: TodoList[];
  _showHideSearchBar: boolean = true;
  _emptyTodoList: boolean = true;
  _showSpinner: boolean = true;
  constructor(private navCtrl: NavController, private _TodoListProvider: TodoListProvider,
    private alert: AlertProvider) {

  }

  ngOnInit() {
    this.getList();
  }

  getList() {
    this._TodoListProvider.getTodoList().then(observableTodoList => {
      observableTodoList.subscribe(todoLists => {
        this._showSpinner = false;
        this._emptyTodoList = todoLists.length < 1;
        this.todoLists = todoLists;
        //console.log('todolist', this.todoLists);
        //console.log('_emptyTodoList', this._emptyTodoList);
        //console.log('showspinner', this._showSpinner);
      })
    });
  }

  addList() {
    const alert: CustomAlert = {
      title: 'List Name',
      message: "Enter a name for this new list",
      inputs: [{
        name: 'name',
        placeholder: 'Title'
      }],
      noText: 'Cancel',
      yesText: 'Save',
      yesToastThen: 'List succesfuly added',
      yesToastCatch: 'Something wrong happened',
      yesFunction: (data => this._TodoListProvider.addList(data))
    }
    this.alert.createAlert(alert);
  }

  deleteList(todoList: TodoList) {
    const alert: CustomAlert = {
      title: 'Delete List',
      message: "Are you sure you want to delete this list?",
      inputs: [],
      noText: 'Cancel',
      yesText: 'Yes',
      yesToastThen: 'List succesfuly deleted',
      yesToastCatch: 'Something wrong happened',
      yesFunction: (_ => this._TodoListProvider.deleteList(todoList))
    }
    this.alert.createAlert(alert);
  }

  updateList(todoList: TodoList) {
    const alert: CustomAlert = {
      title: 'Update List Name',
      message: "Enter the new list name",
      inputs: [
        {
          name: 'name',
          placeholder: 'New Title'
        }
      ],
      noText: 'Cancel',
      yesText: 'Save',
      yesToastThen: 'List name succesfuly updated',
      yesToastCatch: 'Something wrong happened',
      yesFunction: (data => this._TodoListProvider.updateList(todoList, data.name)
      )
    }
    this.alert.createAlert(alert);
  }

  presentToast(message: string) {
    this.alert.presentToast(message);
  }

  goToDetails(todoLists) {
    this.navCtrl.push('DetailsPage', { details: todoLists });
  }

  refreshLists(refresher) {
    //this.todoLists$ = Observable.of(null);
    this.getList();
    setTimeout(() => {
      refresher.complete();
    }, 2000);
  }
}
