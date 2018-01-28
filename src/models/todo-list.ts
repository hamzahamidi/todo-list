export class TodoList {
    id?: string;
    name:string;
    items: Item[];
} 

export class Item {
    id?: string;
    name: string;
    state: boolean;
    description: string;
}

