import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { TodoListService } from '../../core';
import { CustomAlert, TodoList } from '../../models';
import { DateCreatedPipe } from '../../pipes';
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
  ],
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly todoListService = inject(TodoListService);
  private readonly alert = inject(AlertService);

  protected readonly lists = toSignal(this.todoListService.lists$());
  protected readonly title = 'My Notes';
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
    void this.router.navigate(['/details', todoList.id]);
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
      yesFunction: (data) => this.todoListService.createList(data?.['name'] ?? ''),
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
      yesFunction: () => this.todoListService.deleteList(todoList.id),
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
      yesFunction: (data) => this.todoListService.renameList(todoList.id, data?.['name'] ?? ''),
    };
    void this.alert.createAlert(alert);
  }
}
