export class TodoList {
    id?: string;
    name: string;
    items: Set<Item>
}

export class Item {
    id?: string;
    name: string;
    state: boolean;
    description: string;
    constructor(name: string, state: boolean, description: string) {
        this.name = name;
        this.state = state;
        this.description = description;
    }
}

