import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ShareMyNotesPage } from './share-my-notes';
// shared module
import { SharedModule } from '../../shared';

@NgModule({
  declarations: [
    ShareMyNotesPage,
  ],
  imports: [
    IonicPageModule.forChild(ShareMyNotesPage),
    SharedModule
  ],
})
export class ShareMyNotesPageModule {}
