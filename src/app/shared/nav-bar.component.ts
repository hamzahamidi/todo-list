import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { grid, list, search } from 'ionicons/icons';

@Component({
  selector: 'app-nav-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonButton, IonIcon],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ title() }}</ion-title>
        <ion-buttons slot="end">
          @if (enabledChangeDisplay()) {
            <ion-button (click)="changeDisplay()">
              <ion-icon slot="icon-only" [name]="cardOrList() ? 'list' : 'grid'"></ion-icon>
            </ion-button>
          }
          <ion-button (click)="clickSearch.emit()">
            <ion-icon slot="icon-only" name="search"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
})
export class NavBarComponent {
  readonly title = input('');
  readonly enabledChangeDisplay = input(false);
  readonly clickSearch = output<void>();
  readonly changeDisplayed = output<void>();

  protected readonly cardOrList = signal(false);

  constructor() {
    addIcons({ list, grid, search });
  }

  protected changeDisplay(): void {
    this.cardOrList.update((value) => !value);
    this.changeDisplayed.emit();
  }
}
