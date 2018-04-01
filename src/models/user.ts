import { TodoList } from "./todo-list";

export interface User {
  uid: string;
  email: string;
  photoURL?: string;
  displayName?: string;
  favoriteColor?: string;
  todoList?: TodoList[];
  sharedWithMe?: string[];
  iShareWith?: string[];
}