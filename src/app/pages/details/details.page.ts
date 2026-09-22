import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
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
import { FirebaseError } from 'firebase/app';
import { addIcons } from 'ionicons';
import { add, create, trash } from 'ionicons/icons';
import { of, switchMap } from 'rxjs';
import { PhotoService, TodoListService } from '../../core';
import { CustomAlert, Item, TodoList } from '../../models';
import { DateCreatedPipe, FinishedPipe } from '../../pipes';
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
  ],
})
export class DetailsPage {
  private readonly todoListService = inject(TodoListService);
  private readonly photos = inject(PhotoService);
  private readonly alert = inject(AlertService);
  private readonly modalCtrl = inject(ModalController);

  private readonly listId = inject(ActivatedRoute).snapshot.paramMap.get('listId') ?? '';
  private readonly list$ = this.todoListService.list$(this.listId);

  protected readonly todoList = toSignal(this.list$, { initialValue: null });
  protected readonly items = toSignal(
    this.list$.pipe(
      switchMap((list) =>
        list ? this.todoListService.items$(this.listId, list.createdAt) : of<Item[]>([]),
      ),
    ),
    { initialValue: [] },
  );
  protected readonly photoUrls = signal<Record<string, string>>({});

  constructor() {
    addIcons({ trash, create, add });
    effect(() => {
      for (const item of this.items()) {
        void this.loadPhoto(item);
      }
    });
    inject(DestroyRef).onDestroy(() => {
      Object.values(this.photoUrls()).forEach((url) => URL.revokeObjectURL(url));
    });
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
      yesFunction: () => this.removeItem(item),
    };
    void this.alert.createAlert(alert);
  }

  private async removeItem(item: Item): Promise<void> {
    if (item.photoPath) {
      await this.photos.remove(item.photoPath).catch((error: unknown) => {
        if (!(error instanceof FirebaseError && error.code === 'storage/object-not-found')) {
          throw error;
        }
      });
    }
    await this.todoListService.deleteItem(this.listId, item.id);
  }

  private async loadPhoto(item: Item): Promise<void> {
    if (!item.photoPath || this.photoUrls()[item.id]) {
      return;
    }
    const url = await this.photos.objectUrl(item.photoPath);
    this.photoUrls.update((urls) => ({ ...urls, [item.id]: url }));
  }

  private async openItemModal(item?: Item): Promise<void> {
    const list: TodoList | null = this.todoList();
    if (!list) {
      return;
    }
    const modal = await this.modalCtrl.create({
      component: ItemDetailsModalComponent,
      componentProps: { listId: this.listId, listCreatedAt: list.createdAt, item },
    });
    await modal.present();
    await modal.onDidDismiss();
  }
}
