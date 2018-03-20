import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SharedWithMePage } from './shared-with-me';
import { QRScanner } from '@ionic-native/qr-scanner';
import { SharedModule } from '../../shared';

@NgModule({
  declarations: [
    SharedWithMePage,
  ],
  imports: [
    IonicPageModule.forChild(SharedWithMePage),
    SharedModule
  ],
  providers:[
    QRScanner
  ]
})
export class SharedWithMePageModule { }
