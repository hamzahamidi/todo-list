import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { HomePage } from './home';

// Pipe
import { PipesModule } from '../../pipes/pipes.module';
import { SharedModule } from '../../shared';

@NgModule({
  declarations: [HomePage],
  imports: [IonicPageModule.forChild(HomePage),PipesModule,
     SharedModule]
})
export class HomePageModule { }