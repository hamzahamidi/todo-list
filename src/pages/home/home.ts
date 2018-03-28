import { Component } from '@angular/core';
import { NavController, IonicPage, NavParams } from 'ionic-angular';
import { TodoList, CustomAlert, User } from '../../models';
import { TodoListProvider } from '../../core';
import { AlertProvider } from '../../shared';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  subscriberTodoList$: Subscription;
  todoLists: TodoList[];
  titlePage: string = 'My Notes';
  _showHideSearchBar: boolean = true;
  _emptyTodoList: boolean = true;
  _showSpinner: boolean = true;
  _cardOrList: boolean;
  constructor(private navCtrl: NavController, private nav: NavParams, private _TodoListProvider: TodoListProvider,
    private alert: AlertProvider) {

  }

  ngOnInit() {
    const sharedwithMeUser: User = this.nav.get('sharedwithMeUser');
    if (!!sharedwithMeUser) {
      console.log('shared', sharedwithMeUser);
      this.titlePage = `${sharedwithMeUser.displayName} Shared Lists`;
      this.populateLists(this._TodoListProvider.getSharedWithMeTodoList(sharedwithMeUser));
    }
    else this.getList();
  }

  getList() {
    this._TodoListProvider.getTodoList().then(observableTodoList => {
      this.populateLists(observableTodoList);
    });
  }

  private populateLists(observableTodoList: Observable<TodoList[]>) {
    this.subscriberTodoList$ = observableTodoList
      .subscribe(todoLists => {
        this._showSpinner = false;
        this._emptyTodoList = todoLists.length < 1;
        this.todoLists = todoLists;
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

  shareList(todoList: TodoList) {
    this.navCtrl.push('ShareMyNotesPage', { sharedList: todoList });
  }

  presentToast(message: string): void {
    this.alert.presentToast(message);
  }

  goToDetails(todoLists): void {
    this.navCtrl.push('DetailsPage', { details: todoLists });
  }

  refreshLists(refresher): void {
    //this.todoLists$ = Observable.of(null);
    this.getList();
    setTimeout(() => {
      refresher.complete();
    }, 2000);
  }

  ngOnDestroy(): void {
    this.subscriberTodoList$.unsubscribe();
  }
}