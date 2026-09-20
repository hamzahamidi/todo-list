import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonNote,
  IonRow,
  IonText,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, create, trash } from 'ionicons/icons';
import { AuthService, TodoListService } from '../../core';
import { CustomAlert, Item } from '../../models';
import { DateCreatedPipe, FinishedPipe, ValuePipe } from '../../pipes';
import { AlertService, EmptyListComponent } from '../../shared';
import { ItemDetailsModalComponent } from '../item-details/item-details.modal';

@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonBackButton,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardTitle,
    IonCol,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonNote,
    IonRow,
    IonText,
    IonTitle,
    IonToolbar,
    EmptyListComponent,
    DateCreatedPipe,
    FinishedPipe,
    ValuePipe,
  ],
})
export class DetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly todoListService = inject(TodoListService);
  private readonly alert = inject(AlertService);
  private readonly modalCtrl = inject(ModalController);

  private readonly ownerUid = this.route.snapshot.paramMap.get('ownerUid') ?? '';
  private readonly listId = this.route.snapshot.paramMap.get('listId') ?? '';

  protected readonly backHref =
    this.ownerUid && this.ownerUid !== this.auth.uid ? `/home/${this.ownerUid}` : '/home';

  protected readonly todoList = toSignal(
    this.todoListService.list$(this.ownerUid, this.listId),
    { initialValue: null },
  );

  constructor() {
    addIcons({ trash, create, add });
  }

  protected addItem(): void {
    void this.openItemModal();
  }

  protected updateItem(item: Item): void {
    void this.openItemModal(item);
  }

  protected deleteItem(item: Item): void {
    const alert: CustomAlert = {
      title: 'Delete Note',
      message: 'Are you sure you want to delete this Note?',
      inputs: [],
      noText: 'Cancel',
      yesText: 'Yes',
      yesToastThen: 'Note succesfuly deleted',
      yesToastCatch: 'Something wrong happened',
      yesFunction: () =>
        this.todoListService.deleteItem(this.ownerUid, this.listId, item.id),
    };
    void this.alert.createAlert(alert);
  }

  private async openItemModal(item?: Item): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ItemDetailsModalComponent,
      componentProps: { ownerUid: this.ownerUid, listId: this.listId, item },
    });
    await modal.present();
    await modal.onDidDismiss();
  }
}
