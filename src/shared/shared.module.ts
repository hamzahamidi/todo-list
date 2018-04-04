import { NgModule, ModuleWithProviders } from '@angular/core';
import { NavBarComponent, EmptyListComponent, AlertProvider, MediaProvider, SpeechProvider } from './';
import { Camera } from '@ionic-native/camera';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { IonicPageModule } from 'ionic-angular';

@NgModule({
	declarations: [NavBarComponent, EmptyListComponent],
	imports: [
		IonicPageModule.forChild(NavBarComponent),
		IonicPageModule.forChild(EmptyListComponent),
	],
	exports: [NavBarComponent, EmptyListComponent]
})
export class SharedModule {
	static forRoot(): ModuleWithProviders {
		return {
			ngModule: SharedModule,
			providers: [AlertProvider, MediaProvider, Camera, SpeechProvider, SpeechRecognition]
		};
	}
}