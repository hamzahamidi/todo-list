export class TodoList {
    name:string;
    items: Item[];
} 

export class Item {
    name: string;
    state: boolean;
    description: string;
}