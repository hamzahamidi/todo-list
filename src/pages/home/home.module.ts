import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { HomePage } from './home';

// Providers
import { TodoListProvider } from '../../providers/todo-list.service';

// Pipe
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [HomePage],
  imports: [IonicPageModule.forChild(HomePage),PipesModule],
  providers: [TodoListProvider]
})
export class HomePageModule { }