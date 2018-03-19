import { Component } from '@angular/core';

@Component({
  selector: 'empty-list',
  template: `
  <div text-center padding>
  <ion-icon color="gray" name="notifications" style="font-size: 200px;"></ion-icon>
  <h1 ion-text color="gray" text-center>OMG!</h1>
  <h3 ion-text color="gray" text-center>You have no tasks.
    <br>Let's change that!</h3>
</div>`
})
export class EmptyListComponent {

  constructor() { }

}
