import { AlertInputOptions } from "ionic-angular/components/alert/alert-options";

export interface CustomAlert {
    title?: string;
    message?: string;
    inputs?:AlertInputOptions[];
    noText?: string;
    yesText?: string;
    yesToastThen?: string;
    yesToastCatch?: string;
    noToastThen?: string;
    noToastCatch?: string;
    yesFunction?: (data?: any) => Promise<void>
    noFunction?: (data?: any) => Promise<void>
}