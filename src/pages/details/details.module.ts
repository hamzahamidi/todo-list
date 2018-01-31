import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetailsPage } from './details';

// Pipe
import { PipesModule } from '../../pipes/pipes.module';


@NgModule({
  declarations: [DetailsPage],
  imports: [IonicPageModule.forChild(DetailsPage),PipesModule]
})
export class DetailsPageModule { }
