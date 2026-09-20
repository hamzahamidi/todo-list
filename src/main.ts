import { bootstrapApplication } from '@angular/platform-browser';
import {
  PreloadAllModules,
  provideRouter,
  RouteReuseStrategy,
  withPreloading,
  withRouterConfig,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideFirebase } from './app/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideIonicAngular(),
    // Angular's default strategy reuses a component when only route params change,
    // and every page reads paramMap once at construction.
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
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
