import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonAvatar,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonList,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSearchbar,
  IonSpinner,
  IonText,
  type RefresherCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, create, share, trash } from 'ionicons/icons';
import { of, switchMap } from 'rxjs';
import { AuthService, ShareListService, TodoListService } from '../../core';
import { CustomAlert, TodoList, User } from '../../models';
import { DateCreatedPipe, ValuePipe } from '../../pipes';
import { AlertService, EmptyListComponent, NavBarComponent } from '../../shared';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.page.html',
  imports: [
    FormsModule,
    IonAvatar,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCol,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonItem,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonList,
    IonNote,
    IonRefresher,
    IonRefresherContent,
    IonRow,
    IonSearchbar,
    IonSpinner,
    IonText,
    NavBarComponent,
    EmptyListComponent,
    DateCreatedPipe,
    ValuePipe,
  ],
})
export class HomePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly todoListService = inject(TodoListService);
  private readonly shareListService = inject(ShareListService);
  private readonly alert = inject(AlertService);

  private readonly sharedOwnerUid = this.route.snapshot.paramMap.get('ownerUid');
  private readonly ownerUid = this.sharedOwnerUid ?? this.auth.uid ?? '';

  protected readonly isShared = this.sharedOwnerUid !== null;

  protected readonly lists = toSignal(
    this.isShared
      ? this.shareListService
          .sharedListIds$(this.ownerUid)
          .pipe(switchMap((ids) => this.todoListService.listsByIds$(this.ownerUid, ids)))
      : this.todoListService.lists$(this.ownerUid),
  );

  protected readonly sharedUser = toSignal(
    this.isShared ? this.shareListService.sharedUser$(this.ownerUid) : of<User | null>(null),
    { initialValue: null },
  );

  protected readonly title = computed(() =>
    this.isShared ? `${this.sharedUser()?.displayName ?? ''} Shared Lists` : 'My Notes',
  );

  protected readonly cardOrList = signal(false);
  protected readonly searchBarHidden = signal(true);
  protected readonly search = signal('');

  constructor() {
    addIcons({ trash, create, share, add });
  }

  protected toggleDisplay(): void {
    this.cardOrList.update((value) => !value);
  }

  protected toggleSearchBar(): void {
    this.searchBarHidden.update((hidden) => !hidden);
  }

  protected avatarUrl(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&length=1&background=E91E63`;
  }

  protected refreshLists(event: RefresherCustomEvent): void {
    event.detail.complete();
  }

  protected goToDetails(todoList: TodoList): void {
    void this.router.navigate(['/details', this.ownerUid, todoList.id]);
  }

  protected shareTodoList(todoList: TodoList): void {
    void this.router.navigate(['/share-my-notes', todoList.id]);
  }

  protected addList(): void {
    const alert: CustomAlert = {
      title: 'List Name',
      message: 'Enter a name for this new list',
      inputs: [{ name: 'name', placeholder: 'Title' }],
      noText: 'Cancel',
      yesText: 'Save',
      yesToastThen: 'List succesfuly added',
      yesToastCatch: 'Something wrong happened',
      yesFunction: (data) => this.todoListService.addList(this.ownerUid, data?.['name'] ?? ''),
    };
    void this.alert.createAlert(alert);
  }

  protected deleteList(todoList: TodoList): void {
    const alert: CustomAlert = {
      title: 'Delete List',
      message: 'Are you sure you want to delete this list?',
      inputs: [],
      noText: 'Cancel',
      yesText: 'Yes',
      yesToastThen: 'List succesfuly deleted',
      yesToastCatch: 'Something wrong happened',
      yesFunction: () => this.todoListService.deleteList(this.ownerUid, todoList.id),
    };
    void this.alert.createAlert(alert);
  }

  protected renameList(todoList: TodoList): void {
    const alert: CustomAlert = {
      title: 'Update List Name',
      message: 'Enter the new list name',
      inputs: [{ name: 'name', placeholder: 'New Title' }],
      noText: 'Cancel',
      yesText: 'Save',
      yesToastThen: 'List name succesfuly updated',
      yesToastCatch: 'Something wrong happened',
      yesFunction: (data) =>
        this.todoListService.renameList(this.ownerUid, todoList.id, data?.['name'] ?? ''),
    };
    void this.alert.createAlert(alert);
  }

  protected unshareList(todoList: TodoList): void {
    const owner = this.sharedUser();
    if (!owner) {
      return;
    }
    const wasLastList = (this.lists()?.length ?? 0) === 1;
    const alert: CustomAlert = {
      title: 'Unshare list',
      message: `Are you sure you want to stop accessing this list from ${owner.displayName}?`,
      inputs: [],
      noText: 'Cancel',
      yesText: 'Yes',
      yesToastThen: 'Shared list deleted',
      yesToastCatch: 'Something wrong happened',
      yesFunction: () => this.unshare(owner, todoList, wasLastList),
    };
    void this.alert.createAlert(alert);
  }

  private async unshare(owner: User, todoList: TodoList, wasLastList: boolean): Promise<void> {
    await this.shareListService.unshareListWithMe(owner, todoList);
    if (wasLastList) {
      await this.shareListService.deleteSharedUser(owner, true);
      await this.router.navigate(['/shared-with-me']);
    }
  }
}
