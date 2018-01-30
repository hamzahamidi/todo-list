import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Item, TodoList } from '../models/todo-list';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
/*
  Generated class for the TodoListProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class TodoListProvider {
  todoLists: AngularFireList<TodoList>;
  _todoLists;

  constructor(public http: HttpClient, public db: AngularFireDatabase) { }

  getTodoList(): Observable<TodoList[]> {
    this.todoLists = this.db.list('/todo-lists/');
    return this.todoLists.valueChanges();
  }

  addList(data): Promise<void> {
    const todoListRef$ = this.todoLists.push(<TodoList>{});
    const todoList: TodoList = {
      id: todoListRef$.key,
      name: data.name,
      items: new Set()
    };
    // FB creates ID automatically. We just retreive the ID.
    return todoListRef$.set(todoList);
  }

  deleteList(todoList: TodoList): Promise<void> {
    return this.todoLists.remove(todoList.id);
  }


  updateList(todoList: TodoList, name: string): Promise<void> {
    let _todoList: TodoList = todoList;
    _todoList.name = name;
    return this.todoLists.set(todoList.id, _todoList)
  }

  addItem(list: TodoList, item: Item): Promise<void> {
    const path = `/todo-lists/${list.id}/items/`;
    console.log('path:', path);
    const items: AngularFireList<Item> = this.db.list(path);
    const itemRef$ = items.push(<Item>{});
    return itemRef$.set(item);
  }
}
