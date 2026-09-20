import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonIcon, IonText } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { notifications, people } from 'ionicons/icons';

@Component({
  selector: 'app-empty-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon, IonText],
  template: `
    <div class="ion-text-center ion-padding">
      <ion-icon color="gray" [name]="icon()" style="font-size: 200px"></ion-icon>
      @if (h1Text()) {
        <h1><ion-text color="gray">{{ h1Text() }}</ion-text></h1>
      }
      <h3>
        <ion-text color="gray">
          {{ h3Text() }}
          <br />{{ h3TextSecond() }}
        </ion-text>
      </h3>
    </div>
  `,
})
export class EmptyListComponent {
  readonly icon = input('notifications');
  readonly h1Text = input('');
  readonly h3Text = input('');
  readonly h3TextSecond = input('');

  constructor() {
    addIcons({ notifications, people });
  }
}
