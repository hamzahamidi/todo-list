import { Injectable } from '@angular/core';
import { Item, TodoList, User } from '../models';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from 'angularfire2/database';
import { Storage } from '@ionic/storage';

/*
  Generated class for the TodoListProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class TodoListProvider {
  todoLists: AngularFireList<TodoList>;
  baseUrl: string;
  constructor(public db: AngularFireDatabase, private storage: Storage) { }

  // Lists
  getTodoList(): Promise<Observable<TodoList[]>> {
    return this.storage.get("user").then(_user => {
      const user: User = JSON.parse(_user);
      this.baseUrl = `/users/${user.uid}/todo-lists`;
      this.todoLists = this.db.list(this.baseUrl);
      return this.todoLists.valueChanges();
    })
  }
  getSharedWithMeTodoList(user: User): Observable<TodoList[]> {
      this.baseUrl = `/users/${user.uid}/todo-lists`;
      this.todoLists = this.db.list(this.baseUrl);
      return this.todoLists.valueChanges();
  }

  addList(todoList): Promise<void> {
    // FB creates ID automatically. We just retreive the ID.
    const todoListRef$ = this.todoLists.push(<TodoList>{});
    todoList.id = todoListRef$.key;
    todoList.date = Date.now();
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
    const list: AngularFireObject<TodoList> = this.db.object(`${this.baseUrl}/${listId}/`);
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
    return this.db.list(`${this.baseUrl}/${todoList.id}/items/`);
  }

}
