import { bootstrapApplication } from '@angular/platform-browser';
import {
  PreloadAllModules,
  provideRouter,
  withPreloading,
  withRouterConfig,
} from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideFirebase } from './app/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideIonicAngular({ mode: 'md' }),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
    ),
    provideFirebase(),
  ],
}).catch((error: unknown) => console.error(error));

// Gives @capacitor/camera a camera and file picker when running in a browser.
void defineCustomElements(window);
