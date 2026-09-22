import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonCol,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonRow,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import type { Timestamp } from 'firebase/firestore';
import { addIcons } from 'ionicons';
import { camera, close, image as imageIcon, mic } from 'ionicons/icons';
import { PhotoService, TodoListService } from '../../core';
import { Item, ItemChanges, newItem } from '../../models';
import { AlertService, MediaService, SpeechService } from '../../shared';

type VoiceField = 'name' | 'description';

@Component({
  selector: 'app-item-details-modal',
  templateUrl: './item-details.modal.html',
  styleUrl: './item-details.modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    IonButton,
    IonButtons,
    IonCheckbox,
    IonCol,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonRow,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
})
export class ItemDetailsModalComponent implements OnInit {
  /** Assigned by ModalController through componentProps, so these stay plain fields. */
  listId = '';
  listCreatedAt?: Timestamp;
  item?: Item;

  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly state = signal(false);
  protected readonly pendingPhoto = signal('');
  protected readonly existingPhoto = signal('');
  protected readonly image = computed(() => this.pendingPhoto() || this.existingPhoto());

  private date = 0;
  private itemId = '';

  private readonly modalCtrl = inject(ModalController);
  private readonly todoLists = inject(TodoListService);
  private readonly photos = inject(PhotoService);
  private readonly alert = inject(AlertService);
  private readonly media = inject(MediaService);
  private readonly speech = inject(SpeechService);

  constructor() {
    addIcons({ camera, close, image: imageIcon, mic });
    inject(DestroyRef).onDestroy(() => {
      const url = this.existingPhoto();
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
  }

  ngOnInit(): void {
    const seed = this.item ?? newItem();
    this.name.set(seed.name);
    this.description.set(seed.description);
    this.state.set(seed.state);
    this.date = seed.date;
    this.itemId = this.item?.id ?? this.todoLists.newItemId(this.listId);
    const path = this.item?.photoPath;
    if (path) {
      void this.photos.objectUrl(path).then((url) => this.existingPhoto.set(url));
    }
  }

  protected async addItem(): Promise<void> {
    await this.save(null, 'Note succesfuly added');
  }

  protected async updateItem(): Promise<void> {
    if (this.item) {
      await this.save(this.item, 'Note succesfuly updated');
    }
  }

  protected async takePicture(): Promise<void> {
    const picture = await this.media.takePicture();
    if (picture) {
      this.pendingPhoto.set(picture);
    }
  }

  protected async pickFromLibrary(): Promise<void> {
    const picture = await this.media.pickFromLibrary();
    if (picture) {
      this.pendingPhoto.set(picture);
    }
  }

  protected async inputVoice(field: VoiceField): Promise<void> {
    if (!(await this.speech.isReady())) {
      await this.alert.presentToast('Voice input is only available in the app');
      return;
    }
    const text = await this.speech.listen();
    if (!text) {
      return;
    }
    if (field === 'name') {
      this.name.set(text);
    } else {
      this.description.set(text);
    }
  }

  protected async dismiss(changed: boolean): Promise<void> {
    await this.modalCtrl.dismiss(changed);
  }

  // Firestore and Storage share no transaction: upload to a fresh object, write the
  // item once, and remove the new object if that write fails.
  private async save(existing: Item | null, successToast: string): Promise<void> {
    const listCreatedAt = this.listCreatedAt;
    if (!listCreatedAt) {
      return;
    }
    const changes: ItemChanges = {
      name: this.name(),
      state: this.state(),
      description: this.description(),
      date: this.date,
    };
    const pending = this.pendingPhoto();
    let uploaded: string | undefined;
    try {
      if (pending) {
        uploaded = await this.photos.upload(this.listId, listCreatedAt, this.itemId, pending);
        changes.photoPath = uploaded;
      }
      if (existing) {
        await this.todoLists.updateItem(this.listId, existing.id, changes);
      } else {
        await this.todoLists.createItem(this.listId, this.itemId, { ...changes, listCreatedAt });
      }
    } catch {
      if (uploaded) {
        await this.photos.removeQuietly(uploaded);
      }
      await this.alert.presentToast('Something wrong happened');
      return;
    }
    if (uploaded && existing?.photoPath) {
      await this.photos.removeQuietly(existing.photoPath);
    }
    await this.alert.presentToast(successToast);
    await this.dismiss(true);
  }
}
