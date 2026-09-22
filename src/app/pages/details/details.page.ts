import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
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
import { addIcons } from 'ionicons';
import { add, create, trash } from 'ionicons/icons';
import { of, shareReplay, switchMap } from 'rxjs';
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
  private readonly list$ = this.todoListService
    .list$(this.listId)
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  protected readonly todoList = toSignal(this.list$, { initialValue: null });
  protected readonly items = toSignal(
    this.list$.pipe(
      switchMap((list) =>
        list ? this.todoListService.items$(this.listId, list.createdAt) : of<Item[]>([]),
      ),
    ),
    { initialValue: [] },
  );

  private readonly photoUrls = signal<Record<string, string>>({});
  private readonly loadingPhotos = new Set<string>();
  private destroyed = false;

  constructor() {
    addIcons({ trash, create, add });
    effect(() => {
      const wanted = this.photoPaths(this.items());
      untracked(() => this.syncPhotos(wanted));
    });
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      Object.values(this.photoUrls()).forEach((url) => URL.revokeObjectURL(url));
    });
  }

  protected photoUrl(item: Item): string | undefined {
    return item.photoPath ? this.photoUrls()[item.photoPath] : undefined;
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

  // The item goes first: a failed photo delete then leaves an unreferenced object,
  // not a visible item whose photo is missing.
  private async removeItem(item: Item): Promise<void> {
    await this.todoListService.deleteItem(this.listId, item.id);
    if (item.photoPath) {
      await this.photos.removeQuietly(item.photoPath);
    }
  }

  private photoPaths(items: Item[]): Set<string> {
    return new Set(items.flatMap((item) => (item.photoPath ? [item.photoPath] : [])));
  }

  private syncPhotos(wanted: Set<string>): void {
    const current = this.photoUrls();
    const stale = Object.keys(current).filter((path) => !wanted.has(path));
    if (stale.length > 0) {
      stale.forEach((path) => URL.revokeObjectURL(current[path]));
      this.photoUrls.set(
        Object.fromEntries(Object.entries(current).filter(([path]) => wanted.has(path))),
      );
    }
    for (const path of wanted) {
      if (!current[path] && !this.loadingPhotos.has(path)) {
        void this.loadPhoto(path);
      }
    }
  }

  private async loadPhoto(path: string): Promise<void> {
    this.loadingPhotos.add(path);
    try {
      const url = await this.photos.objectUrl(path);
      if (this.destroyed || !this.photoPaths(this.items()).has(path)) {
        URL.revokeObjectURL(url);
        return;
      }
      this.photoUrls.update((urls) => ({ ...urls, [path]: url }));
    } catch {
      return;
    } finally {
      this.loadingPhotos.delete(path);
    }
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
