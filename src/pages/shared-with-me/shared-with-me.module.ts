import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SharedWithMePage } from './shared-with-me';
import { QRScanner } from '@ionic-native/qr-scanner';
import { SharedModule } from '../../shared';
import { PipesModule } from '../../pipes';

@NgModule({
  declarations: [
    SharedWithMePage,
  ],
  imports: [
    IonicPageModule.forChild(SharedWithMePage),
    SharedModule,
    PipesModule
  ],
  providers:[
    QRScanner
  ]
})
export class SharedWithMePageModule { }
