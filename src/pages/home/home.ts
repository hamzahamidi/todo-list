import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Item, TodoList } from '../../models/todo-list';
import { TodoListProvider } from '../../providers/todo-list';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  todoLists$: Observable<TodoList[]>;
  items: Item[] = [];
  test;
  constructor(public navCtrl: NavController, public _TodoListProvider: TodoListProvider) {

  }

  ngOnInit() {
    this.todoLists$ = this._TodoListProvider.getTodoList();
  }
}
