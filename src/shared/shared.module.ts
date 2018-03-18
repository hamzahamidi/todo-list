import { NgModule, ModuleWithProviders } from '@angular/core';
import { NavBarComponent, AlertProvider } from './';
import { IonicPageModule } from 'ionic-angular';
@NgModule({
	declarations: [NavBarComponent],
	imports: [
		IonicPageModule.forChild(NavBarComponent),
	],
	exports: [NavBarComponent]
})
export class SharedModule {
	static forRoot(): ModuleWithProviders {
		return {
			ngModule: SharedModule,
			providers: [AlertProvider]
		};
	}
}