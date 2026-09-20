import { AsyncPipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  IonAvatar,
  IonContent,
  IonIcon,
  IonItem,
  IonItemDivider,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  type SegmentCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { create, peopleCircle, qrCode, share, trash } from 'ionicons/icons';
import QRCode from 'qrcode';
import { map } from 'rxjs';
import { AuthService, ShareListService } from '../../core';
import { CustomAlert, User } from '../../models';
import { AlertService, EmptyListComponent, NavBarComponent } from '../../shared';

type SharePanel = 'shared-users' | 'qr-scanner';

@Component({
  selector: 'app-share-my-notes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './share-my-notes.page.html',
  styleUrl: './share-my-notes.page.scss',
  imports: [
    AsyncPipe,
    NavBarComponent,
    EmptyListComponent,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonIcon,
    IonSearchbar,
    IonList,
    IonItemDivider,
    IonSpinner,
    IonItemSliding,
    IonItem,
    IonAvatar,
    IonItemOptions,
    IonItemOption,
  ],
})
export class ShareMyNotesPage {
  private readonly auth = inject(AuthService);
  private readonly shareList = inject(ShareListService);
  private readonly alerts = inject(AlertService);
  private readonly listId = inject(ActivatedRoute).snapshot.paramMap.get('listId');

  private readonly qrCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('qrimage');

  protected readonly sharingOneList = this.listId !== null;
  protected readonly panel = signal<SharePanel>(this.listId ? 'qr-scanner' : 'shared-users');
  protected readonly searchVisible = signal(false);

  protected readonly sharedUsers = toSignal(
    this.shareList
      .uidsIShareWith$()
      .pipe(map((uids) => uids.map((uid) => ({ uid, user$: this.shareList.sharedUser$(uid) })))),
  );

  constructor() {
    addIcons({ peopleCircle, qrCode, create, share, trash });
    afterNextRender(() => this.renderQrCode());
  }

  protected selectPanel(event: Event): void {
    const value = (event as SegmentCustomEvent).detail.value;
    this.panel.set(value === 'qr-scanner' ? 'qr-scanner' : 'shared-users');
  }

  protected toggleSearch(): void {
    this.searchVisible.update((visible) => !visible);
  }

  protected deleteUser(user: User): void {
    const alert: CustomAlert = {
      title: 'Stop sharing',
      message: `Are you sure you want to stop sharing with ${user.displayName}?`,
      inputs: [],
      noText: 'Cancel',
      yesText: 'Yes',
      yesToastThen: 'Shared User deleted',
      yesToastCatch: 'Something wrong happened',
      yesFunction: () => this.shareList.deleteSharedUser(user, false),
    };
    void this.alerts.createAlert(alert);
  }

  private renderQrCode(): void {
    const uid = this.auth.uid;
    if (!uid) {
      return;
    }
    const payload = JSON.stringify({
      uid,
      todoList: this.listId ? { id: this.listId, read: true, write: true } : {},
    });
    QRCode.toCanvas(this.qrCanvas().nativeElement, payload, { width: 300 }).catch(
      (error: unknown) => console.error(error),
    );
  }
}
