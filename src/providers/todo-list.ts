import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Item, TodoList } from '../models/todo-list';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
/*
  Generated class for the TodoListProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class TodoListProvider {

  constructor(public http: HttpClient) {
    console.log('Hello TodoListProvider Provider');
  }
  getTodoList():Observable<TodoList[]> {
    const url = 'api/json/todo-lists.json';
    return this.http.get(url).map(res => <TodoList[]>res);
  }

}
