import { Component } from '@angular/core';
import { IonicPage, NavParams } from 'ionic-angular';
import { TodoList } from '../../models/todo-list';

/**
 * Generated class for the DetailsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-details',
  templateUrl: 'details.html',
})
export class DetailsPage {
  todoList: TodoList;

  constructor(public navParams: NavParams) {
  }

  ngOnInit() {
    this.todoList = this.navParams.get('details');
  }

}
