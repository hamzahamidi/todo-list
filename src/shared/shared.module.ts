import { NgModule } from '@angular/core';
import { NavBarComponent } from './';
import { IonicPageModule } from 'ionic-angular';
@NgModule({
	declarations: [NavBarComponent],
	imports: [
		IonicPageModule.forChild(NavBarComponent),
	],
	exports: [NavBarComponent]
})
export class SharedModule { }