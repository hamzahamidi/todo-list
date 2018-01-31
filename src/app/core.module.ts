import { NgModule } from '@angular/core';

// Import the AngularFire2 Module
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFirestoreModule } from 'angularfire2/firestore';

// Providers
import { GooglePlus } from '@ionic-native/google-plus';
import { AuthProvider } from '../providers/auth.service';
import { TodoListProvider } from '../providers/todo-list.service';


@NgModule({
  imports: [
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AngularFirestoreModule
  ],
  providers: [GooglePlus, AuthProvider, TodoListProvider]
})
export class CoreModule { }