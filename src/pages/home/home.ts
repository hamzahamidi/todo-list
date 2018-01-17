import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Item, TodoList } from '../../models/todo-list';
import { TodoListProvider } from '../../providers/todo-list';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  todoLists: TodoList[];
  items: Item[] = [];
  test;
  constructor(public navCtrl: NavController, public _TodoListProvider: TodoListProvider) {

  }

  ngOnInit() {
    this._TodoListProvider.getTodoList().subscribe(todoList => this.todoLists = todoList);
  }
}
