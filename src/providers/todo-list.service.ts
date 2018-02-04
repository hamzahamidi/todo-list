import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Item, TodoList } from '../models/todo-list';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from 'angularfire2/database';
/*
  Generated class for the TodoListProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class TodoListProvider {
  todoLists: AngularFireList<TodoList>;

  constructor(public http: HttpClient, public db: AngularFireDatabase) { }

  // Lists
  getTodoList(): Observable<TodoList[]> {
    this.todoLists = this.db.list('/todo-lists/');
    return this.todoLists.valueChanges();
  }

  addList(rawTodoList): Promise<void> {
    const todoListRef$ = this.todoLists.push(<TodoList>{});
    const todoList: TodoList = {
      id: todoListRef$.key,
      name: rawTodoList.name,
      items: new Set()
    };
    // FB creates ID automatically. We just retreive the ID.
    return todoListRef$.set(todoList);
  }

  deleteList(todoList: TodoList): Promise<void> {
    return this.todoLists.remove(todoList.id);
  }


  updateList(todoList: TodoList, name: string): Promise<void> {
    todoList.name = name;
    return this.todoLists.set(todoList.id, todoList);
  }

  getOneList(listId: string): Observable<TodoList> {
    const list: AngularFireObject<TodoList> = this.db.object(`/todo-lists/${listId}/`);
    return list.valueChanges();
  }

  // items

  addItem(todoList: TodoList, item: Item): Promise<void> {
    const itemRef$ = this.buildAngularFireListOfItems(todoList).push(<Item>{});
    item.id = itemRef$.key;
    return itemRef$.set(item);
  }

  deleteItem(todoList: TodoList, item: Item): Promise<void> {
    return this.buildAngularFireListOfItems(todoList).remove(item.id);
  }

  updateItem(todoList: TodoList, item: Item): Promise<void> {
    return this.buildAngularFireListOfItems(todoList).set(item.id, item);
  }

  buildAngularFireListOfItems(todoList: TodoList): AngularFireList<Item> {
    return this.db.list(`/todo-lists/${todoList.id}/items/`);
  }

}
