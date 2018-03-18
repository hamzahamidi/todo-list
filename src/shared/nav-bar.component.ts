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
      <button ion-button icon-only (click)="clickSearch()">
        <ion-icon name="search"></ion-icon>
      </button>
  </ion-buttons>
  </ion-navbar>`
})
export class NavBarComponent {

  @Input() title: string;
  @Output() onClickSearch = new EventEmitter<void>();

  constructor() { }

  clickSearch(){
    this.onClickSearch.emit();
  }

}
