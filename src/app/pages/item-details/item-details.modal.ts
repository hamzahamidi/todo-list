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
import { Item, newItem } from '../../models';
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

  private async save(existing: Item | null, successToast: string): Promise<void> {
    const listCreatedAt = this.listCreatedAt;
    if (!listCreatedAt) {
      return;
    }
    const fields = {
      name: this.name(),
      state: this.state(),
      description: this.description(),
      date: this.date,
    };
    try {
      const id = existing?.id ?? (await this.todoLists.addItem(this.listId, listCreatedAt, fields));
      const pending = this.pendingPhoto();
      const photoPath = pending
        ? await this.photos.upload(this.listId, listCreatedAt, id, pending)
        : existing?.photoPath;
      if (existing || photoPath) {
        const item: Item = { ...fields, id, listCreatedAt };
        if (photoPath) {
          item.photoPath = photoPath;
        }
        await this.todoLists.updateItem(this.listId, item);
      }
      await this.alert.presentToast(successToast);
    } catch {
      await this.alert.presentToast('Something wrong happened');
    }
    await this.dismiss(true);
  }
}
