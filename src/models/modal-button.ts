export interface ModalButton {
    name: string;
    color: string;
    iconName?: string;
    iconColor?: string;
    action?: (arg?: any) => any;
}