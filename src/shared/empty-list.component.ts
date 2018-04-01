import { Component, Input } from '@angular/core';

@Component({
  selector: 'empty-list',
  template: `
  <div text-center padding>
  <ion-icon color="gray" name="{{icon}}" style="font-size: 200px;"></ion-icon>
  <h1 ion-text color="gray" text-center>{{h1Text}}</h1>
  <h3 ion-text color="gray" text-center>{{h3Text}}
    <br>{{h3Textsecond}}</h3>
</div>`
})
export class EmptyListComponent {
  @Input() icon: string;
  @Input() h1Text: string;
  @Input() h3Text: string;
  @Input() h3Textsecond: string;
}