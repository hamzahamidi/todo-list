import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Item, TodoList } from '../models/todo-list';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { ThenableReference } from '@firebase/database-types';
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
    this.todoLists = this.db.list('/');
    // FB creates ID automatically. We just retreive the ID.
    return this.db.list('/').snapshotChanges().map(data => {
      return data.map(snap => Object.assign(snap.payload.val(), { id: snap.key }));
    });
  }

  addList(data): ThenableReference {
    // console.log('data:', data);
    const item: Item = {
      name: data.task,
      state: false,
      description: 'No description'
    };
    const todoList: TodoList = {
      name: data.name,
      items: [item]
    };
    return this.todoLists.push(todoList);
  }

  deleteList(todoList: TodoList): Promise<void> {
    return this.todoLists.remove(todoList.id);
  }


  updateList(todoList: TodoList, name: string) {
    let _todoList: TodoList = todoList;
    _todoList.name = name;
    return this.todoLists.set(todoList.id, _todoList)
  }
}
