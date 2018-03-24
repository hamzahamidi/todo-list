import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * Generated class for the NavBarComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'nav-bar',
  template: `
  <ion-navbar color='primary'>
        <button ion-button menuToggle>
            <ion-icon  name="menu"></ion-icon>
        </button>
  <ion-title>{{title}}</ion-title>
  <ion-buttons end>
      <button *ngIf="enabledChangeDisplay" [hidden]="!cardOrList" ion-button icon-only (click)="changeDisplay()">
        <ion-icon name="list"></ion-icon>
      </button>
      <button *ngIf="enabledChangeDisplay" [hidden]="cardOrList" ion-button icon-only (click)="changeDisplay()">
        <ion-icon name="grid"></ion-icon>
      </button>
      <button ion-button icon-only (click)="clickSearch()">
        <ion-icon name="search"></ion-icon>
      </button>
  </ion-buttons>
  </ion-navbar>`
})
export class NavBarComponent {

  @Input() title: string;
  @Input() enabledChangeDisplay: boolean;
  @Input() cardOrList: boolean;
  @Output() onClickSearch = new EventEmitter<void>();
  @Output() onChangeDisplay = new EventEmitter<void>();

  clickSearch() {
    this.onClickSearch.emit();
  }

  changeDisplay() {
    this.cardOrList = !this.cardOrList;
    this.onChangeDisplay.emit();
  }
}