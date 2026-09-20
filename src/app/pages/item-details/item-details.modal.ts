import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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
import { addIcons } from 'ionicons';
import { camera, close, image as imageIcon, mic } from 'ionicons/icons';
import { TodoListService } from '../../core';
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
  ownerUid = '';
  listId = '';
  item?: Item;

  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly state = signal(false);
  protected readonly image = signal('');

  private date = 0;

  private readonly modalCtrl = inject(ModalController);
  private readonly todoLists = inject(TodoListService);
  private readonly alert = inject(AlertService);
  private readonly media = inject(MediaService);
  private readonly speech = inject(SpeechService);

  constructor() {
    addIcons({ camera, close, image: imageIcon, mic });
  }

  ngOnInit(): void {
    const seed = this.item ?? newItem();
    this.name.set(seed.name);
    this.description.set(seed.description);
    this.state.set(seed.state);
    this.image.set(seed.image ?? '');
    this.date = seed.date;
  }

  protected async addItem(): Promise<void> {
    try {
      await this.todoLists.addItem(this.ownerUid, this.listId, this.draft());
      await this.alert.presentToast('Note succesfuly added');
    } catch {
      await this.alert.presentToast('Something wrong happened');
    }
    await this.dismiss(true);
  }

  protected async updateItem(): Promise<void> {
    const current = this.item;
    if (!current) {
      return;
    }
    try {
      await this.todoLists.updateItem(this.ownerUid, this.listId, {
        ...this.draft(),
        id: current.id,
      });
      await this.alert.presentToast('Note succesfuly updated');
    } catch {
      await this.alert.presentToast('Something wrong happened');
    }
    await this.dismiss(true);
  }

  protected async takePicture(): Promise<void> {
    const picture = await this.media.takePicture();
    if (picture) {
      this.image.set(picture);
    }
  }

  protected async pickFromLibrary(): Promise<void> {
    const picture = await this.media.pickFromLibrary();
    if (picture) {
      this.image.set(picture);
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

  private draft(): Omit<Item, 'id'> {
    const draft: Omit<Item, 'id'> = {
      name: this.name(),
      state: this.state(),
      description: this.description(),
      date: this.date,
    };
    const image = this.image();
    if (image) {
      draft.image = image;
    }
    return draft;
  }
}
