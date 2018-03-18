import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ItemDetailsPage } from './item-details';
// shared module
import { SharedModule } from '../../shared';
@NgModule({
  declarations: [
    ItemDetailsPage,
  ],
  imports: [
    IonicPageModule.forChild(ItemDetailsPage),
    SharedModule
  ]
})
export class ItemDetailsPageModule {}