import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ItemDetailsPage } from './item-details';

// providers
import { TodoListProvider } from '../../providers/todo-list.service';

@NgModule({
  declarations: [
    ItemDetailsPage,
  ],
  imports: [
    IonicPageModule.forChild(ItemDetailsPage),
  ],
  providers:[TodoListProvider]
})
export class ItemDetailsPageModule {}