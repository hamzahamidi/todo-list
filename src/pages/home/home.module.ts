import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { HomePage } from './home';

// Providers
import { TodoListProvider } from '../../providers/todo-list.service';

@NgModule({
  declarations: [HomePage],
  imports: [IonicPageModule.forChild(HomePage)],
  providers: [TodoListProvider]
})
export class HomePageModule { }