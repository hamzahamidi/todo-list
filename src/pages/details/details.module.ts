import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetailsPage } from './details';

// Pipe
import { PipesModule } from '../../pipes/pipes.module';
// shared module
import { SharedModule } from '../../shared';

@NgModule({
  declarations: [DetailsPage],
  imports: [IonicPageModule.forChild(DetailsPage), PipesModule, SharedModule]
})
export class DetailsPageModule { }
